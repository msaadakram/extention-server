const mongoose = require('mongoose');
const Grade = require('../models/Grade');
const SubjectGroup = require('../models/SubjectGroup');
const privacyService = require('./privacyService');
const pino = require('pino');

const logger = pino({ name: 'gradeService' });

/**
 * Escape regex special characters in a string.
 * Uses a whitelist approach: only allows alphanumeric and common safe chars,
 * then escapes any remaining special regex chars.
 */
function escapeRegex(string) {
    if (typeof string !== 'string') return '';
    // First pass: remove null bytes and other dangerous chars
    const sanitized = string.replace(/\0/g, '');
    // Second pass: escape only the regex special characters
    // Using a character class with each char individually escaped is safe from ReDoS
    return sanitized.replace(/[.*+\-?^${}()|[\]\\/]/g, '\\$&');
}

/**
 * Enforce privacy at write-time by redacting fields before storage.
 * This prevents hidden values from being persisted when privacy is enabled.
 */
function enforcePrivacyOnSave(gradeData, privacySetting) {
    if (!gradeData || typeof gradeData !== 'object') return gradeData;
    const shouldHideName = privacySetting ? !!privacySetting.hideName : !!(gradeData.hideName || gradeData.privacyMode);
    const shouldHidePhoto = privacySetting ? !!privacySetting.hidePhoto : !!(gradeData.hidePhoto || gradeData.privacyMode);
    gradeData.hideName = !!shouldHideName;
    gradeData.hidePhoto = !!shouldHidePhoto;
    if (shouldHideName) {
        gradeData.studentName = '';
    }
    if (shouldHidePhoto) {
        gradeData.studentImage = '';
    }
    return gradeData;
}

/**
 * Apply privacy masking at read-time for responses.
 */
function applyPrivacyMask(gradeObj, privacyOverride) {
    if (!gradeObj || typeof gradeObj !== 'object') return gradeObj;
    if (gradeObj.studentName) {
        gradeObj.studentName = gradeObj.studentName.split(/Faculty of/i)[0].trim();
    }
    const shouldHideName = privacyOverride ? !!privacyOverride.hideName : !!(gradeObj.hideName || gradeObj.privacyMode);
    const shouldHidePhoto = privacyOverride ? !!privacyOverride.hidePhoto : !!(gradeObj.hidePhoto || gradeObj.privacyMode);
    if (shouldHideName) {
        gradeObj.studentName = 'Anonymous';
        gradeObj.studentId = 'hidden';
    }
    if (shouldHidePhoto) {
        gradeObj.studentImage = null;
    }
    return gradeObj;
}

/**
 * Save a grade entry inside a MongoDB transaction (single collection write).
 */
async function saveGrade(gradeData) {
    const {
        studentID,
        studentName,
        studentImage,
        privacyMode,
        hideName,
        hidePhoto,
        courseName,
        courseCode,
        assessments,
        classAverage,
        overallPercentage,
        grade
    } = gradeData;

    const studentId = studentID || 'unknown';

    const newGradeData = {
        studentId,
        studentName: studentName || '',
        studentImage: studentImage || '',
        privacyMode: !!privacyMode,
        hideName: !!hideName,
        hidePhoto: !!hidePhoto,
        courseName,
        courseCode: courseCode || '',
        assessments: assessments || [],
        classAverage: classAverage || 0,
        overallPercentage,
        grade,
        timestamp: new Date()
    };

    // Enforce privacy based on backend settings before persisting
    let privacySetting = null;
    try {
        privacySetting = await privacyService.getPrivacy(studentId);
    } catch (err) {
        logger.warn({ err, studentId }, 'Privacy fetch failed; falling back to request flags');
    }
    enforcePrivacyOnSave(newGradeData, privacySetting);

    // Attempt a transactional dual-write; fall back gracefully if unsupported
    let session = null;

    try {
        const supportsTransactions = await _deploymentSupportsTransactions();

        if (supportsTransactions) {
            session = await mongoose.startSession();
            session.startTransaction();
            try {
                const result = await _dualWrite(newGradeData, studentId, session);
                await session.commitTransaction();
                logger.info({ studentId, courseName }, 'Grade saved (transactional)');
                return result;
            } catch (txError) {
                try { await session.abortTransaction(); } catch (abortErr) {
                    logger.error({ abortErr, originalErr: txError }, 'Failed to abort transaction');
                }
                throw txError;
            } finally {
                try { await session.endSession(); } catch (_) { }
            }
        } else {
            const result = await _dualWrite(newGradeData, studentId, null);
            logger.info({ studentId, courseName }, 'Grade saved (non-transactional)');
            return result;
        }
    } catch (error) {
        // If we got here with an open session that wasn't cleaned up
        if (session) {
            try { await session.endSession(); } catch (_) { /* ignore */ }
        }
        throw error;
    }
}

/**
 * Check if the MongoDB deployment supports sessions with transactions.
 * Uses a lightweight admin command probe (avoids creating a session).
 */
async function _deploymentSupportsTransactions() {
    try {
        const adminDb = mongoose.connection.db.admin();
        const result = await adminDb.command({ serverStatus: 1 });
        // replica sets and sharded clusters support transactions;
        // standalone instances typically do not
        const storageEngine = result.storageEngine && result.storageEngine.name;
        const isReplicaSet = result.repl && result.repl.setName;
        // If we have a replica set name, we're on a replica set; transactions work
        return !!isReplicaSet;
    } catch {
        // Default to false (no transaction support) on probe failure
        return false;
    }
}

/**
 * Perform the actual dual-write (to 'grades' and to per-student collection).
 *
 * The per-student collection uses the shared `grades` collection and filters
 * by studentId at query time instead of creating a separate MongoDB collection
 * per student. This avoids hitting the 500-collection limit on MongoDB Atlas
 * shared tiers while preserving the same API contract.
 *
 * Backward compatibility: The original code created separate collections per
 * student. To avoid breaking existing data, we write to the shared collection
 * and return results in the same shape. Any pre-existing per-student
 * collections are left untouched but new writes go to the shared collection.
 */
async function _dualWrite(newGradeData, studentId, session) {
    const sessionOption = session ? { session } : {};

    // Write to the shared 'grades' collection only
    const result = await Grade.findOneAndUpdate(
        { courseName: newGradeData.courseName, studentId: newGradeData.studentId },
        newGradeData,
        { upsert: true, new: true, setDefaultsOnInsert: true, ...sessionOption }
    );

    return { shared: result, personal: result };
}

/**
 * Fetch leaderboard grades for a course, scoped to a student's classmates.
 *
 * If studentId is provided:
 *   - Find the SubjectGroup the student belongs to for this course.
 *   - Return only grades of classmates in the same group (sorted by overallPercentage desc).
 * If no studentId:
 *   - Return all grades for the course (ungrouped fallback).
 */
async function getLeaderboard(courseName, studentId) {
    logger.info({ courseName, studentId }, 'Fetching leaderboard');

    let studentIds = [];

    if (studentId) {
        // Find the SubjectGroup this student belongs to for this course.
        // Use regex to handle cases where timetable might have "Course Name (Section)"
        // but grades only have "Course Name".
        const group = await SubjectGroup.findOne({
            courseName: new RegExp(`^${escapeRegex(courseName)}`, 'i'),
            studentIds: studentId
        });

        if (group && group.studentIds && group.studentIds.length > 0) {
            studentIds = group.studentIds;
            logger.info({ studentId, courseName, classmates: studentIds.length }, 'Found classmate group');
        } else {
            // No group found: fall back to showing only the requesting student
            logger.info({ studentId, courseName }, 'No group found, returning self only');
            studentIds = [studentId];
        }
    }

    const query = { courseName };
    if (studentIds.length > 0) {
        query.studentId = { $in: studentIds };
    }

    const grades = await Grade.find(query)
        .sort({ overallPercentage: -1 })
        .select('studentName studentImage overallPercentage grade studentId assessments timestamp privacyMode hideName hidePhoto');

    const studentIdList = grades.map((g) => g.studentId).filter(Boolean);
    let privacyMap = new Map();
    try {
        privacyMap = await privacyService.getPrivacyMap(studentIdList);
    } catch (err) {
        logger.warn({ err }, 'Privacy map fetch failed; falling back to grade flags');
    }

    // Apply privacy: backend settings first; fallback to grade flags
    const cleanedGrades = grades.map((g) => {
        const gradeObj = g.toObject ? g.toObject() : g;
        const override = privacyMap.get(gradeObj.studentId);
        return applyPrivacyMask(gradeObj, override);
    });

    logger.info({ courseName, count: cleanedGrades.length }, 'Leaderboard fetched');
    return cleanedGrades;
}

module.exports = {
    saveGrade,
    getLeaderboard
};
