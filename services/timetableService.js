const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const SubjectGroup = require('../models/SubjectGroup');
const pino = require('pino');

const logger = pino({ name: 'timetableService' });

/**
 * Normalize a text value: trim whitespace, coerce to string.
 */
function normalizeText(value) {
    return String(value ?? '').trim();
}

/**
 * Sanitize and normalize timetable entries from the client payload.
 * Filters out invalid/incomplete entries.
 */
function sanitizeTimetableEntries(timetable) {
    if (!Array.isArray(timetable)) return [];

    return timetable
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) => ({
            class: normalizeText(entry.class),
            time: normalizeText(entry.time),
            teacher: normalizeText(entry.teacher),
            courseName: normalizeText(entry.courseName),
            day: normalizeText(entry.day),
            room: normalizeText(entry.room)
        }))
        .filter(
            (entry) =>
                entry.courseName &&
                entry.day &&
                entry.time &&
                entry.teacher
        );
}

/**
 * Save a student's timetable and rebuild SubjectGroup memberships.
 *
 * This operation is conceptually multi-document and should ideally be atomic.
 * We use a Mongoose session. If the deployment supports transactions,
 * the full sequence (deleteMany + insertMany + SubjectGroup rebuild) runs
 * inside a single transaction. Otherwise, it falls back to sequential writes.
 *
 * @param {string} studentID - Normalized student identifier.
 * @param {Array} rawTimetable - Raw timetable entries from client.
 * @returns {Object} { entriesSaved: number }
 */
async function saveTimetable(studentID, rawTimetable) {
    const normalizedStudentId = normalizeText(studentID);
    const normalizedTimetable = sanitizeTimetableEntries(rawTimetable);

    if (!normalizedTimetable.length) {
        throw Object.assign(new Error('No valid timetable entries found in payload'), {
            status: 400,
            code: 'NO_VALID_ENTRIES'
        });
    }

    let session = null;

    try {
        const supportsTransactions = await _deploymentSupportsTransactions();

        if (supportsTransactions) {
            session = await mongoose.startSession();
            session.startTransaction();
            try {
                await _rebuildTimetable(normalizedStudentId, normalizedTimetable, session);
                await session.commitTransaction();
                logger.info(
                    { studentID: normalizedStudentId, entries: normalizedTimetable.length },
                    'Timetable saved (transactional)'
                );
            } catch (txError) {
                try { await session.abortTransaction(); } catch (abortErr) {
                    logger.error({ abortErr, originalErr: txError }, 'Failed to abort timetable transaction');
                }
                throw txError;
            } finally {
                try { await session.endSession(); } catch (_) {}
            }
        } else {
            await _rebuildTimetable(normalizedStudentId, normalizedTimetable, null);
            logger.info(
                { studentID: normalizedStudentId, entries: normalizedTimetable.length },
                'Timetable saved (non-transactional)'
            );
        }

        return { entriesSaved: normalizedTimetable.length };
    } catch (error) {
        if (session) {
            try { await session.endSession(); } catch (_) { /* ignore */ }
        }
        throw error;
    }
}

/**
 * Check if the MongoDB deployment supports transactions.
 */
async function _deploymentSupportsTransactions() {
    try {
        const adminDb = mongoose.connection.db.admin();
        const result = await adminDb.command({ serverStatus: 1 });
        const isReplicaSet = result.repl && result.repl.setName;
        return !!isReplicaSet;
    } catch {
        return false;
    }
}

/**
 * Core logic: delete old timetable entries, insert new ones, rebuild SubjectGroups.
 */
async function _rebuildTimetable(studentId, entries, session) {
    const sessionOption = session ? { session } : {};

    // 1. Remove old timetable entries for this student
    await Timetable.deleteMany({ studentID: studentId }, sessionOption);

    // 2. Insert new entries
    const timetableDocs = entries.map((entry) => ({
        ...entry,
        studentID: studentId
    }));
    await Timetable.insertMany(timetableDocs, sessionOption);

    // 3. Rebuild SubjectGroups
    // First, remove student from ALL existing groups
    await SubjectGroup.updateMany(
        { studentIds: studentId },
        { $pull: { studentIds: studentId } },
        sessionOption
    );

    // Then, add student back into the correct groups based on timetable
    for (const entry of entries) {
        const { day, time, teacher, courseName } = entry;
        const groupQuery = { courseName, day, time, teacher };

        try {
            await SubjectGroup.findOneAndUpdate(
                groupQuery,
                { $addToSet: { studentIds: studentId } },
                { upsert: true, new: true, setDefaultsOnInsert: true, ...sessionOption }
            );
        } catch (groupError) {
            if (groupError && groupError.code === 11000) {
                // Rare upsert race: the group was created by a concurrent request.
                // Retry with a plain update.
                logger.warn(
                    { groupQuery, studentId },
                    'Duplicate key on SubjectGroup upsert, retrying with updateOne'
                );
                await SubjectGroup.updateOne(
                    groupQuery,
                    { $addToSet: { studentIds: studentId } },
                    sessionOption
                );
            } else {
                throw groupError;
            }
        }
    }
}

module.exports = {
    saveTimetable
};
