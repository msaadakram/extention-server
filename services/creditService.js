const mongoose = require('mongoose');
const pino = require('pino');
const { COURSE_NAMES, DEFAULTS } = require('../config/constants');

const logger = pino({ name: 'creditService' });
const CREDITS_DEFAULT = DEFAULTS.CREDITS_DEFAULT;

// Store credits in 'grades' collection (no new collection = no limit hit)
const COURSE = COURSE_NAMES.CREDITS;

async function _getOrCreate(studentId) {
    const db = mongoose.connection.db;
    if (!db) throw new Error('No database connection');

    const coll = db.collection('grades');
    const now = new Date();

    try {
        const result = await coll.findOneAndUpdate(
            { studentId, courseName: COURSE },
            [
                {
                    $set: {
                        studentId: studentId,
                        courseName: COURSE,
                        overallPercentage: { $ifNull: ["$overallPercentage", 0] },
                        grade: { $ifNull: ["$grade", "N/A"] },
                        credits: { $ifNull: ["$credits", CREDITS_DEFAULT] },
                        timestamp: { $ifNull: ["$timestamp", now] }
                    }
                }
            ],
            { upsert: true, returnDocument: 'after', returnOriginal: false }
        );

        const doc = result && result.value ? result.value : result;
        if (!doc) {
            throw new Error('Failed to get or create credit record for ' + studentId);
        }
        return doc;
    } catch (e) {
        logger.error({ err: e }, 'findOneAndUpdate failed in _getOrCreate');
        throw e;
    }
}

async function getCredits(studentId) {
    logger.info({ studentId }, 'Fetching credits');
    const doc = await _getOrCreate(studentId);
    return { studentId: doc.studentId, credits: doc.credits };
}

async function deductCredit(studentId) {
    logger.info({ studentId }, 'Deducting credit');
    const db = mongoose.connection.db;
    const coll = db.collection('grades');
    const now = new Date();

    const result = await coll.findOneAndUpdate(
        { studentId, courseName: COURSE },
        [
            {
                $set: {
                    studentId: studentId,
                    courseName: COURSE,
                    overallPercentage: { $ifNull: ["$overallPercentage", 0] },
                    grade: { $ifNull: ["$grade", "N/A"] },
                    credits: {
                        $max: [
                            0,
                            { $subtract: [{ $ifNull: ["$credits", CREDITS_DEFAULT] }, 1] }
                        ]
                    },
                    timestamp: now
                }
            }
        ],
        { upsert: true, returnDocument: 'after', returnOriginal: false }
    );

    const doc = result && result.value ? result.value : result;
    logger.info({ studentId, credits: doc.credits }, 'Credit deducted');
    return { studentId: doc.studentId, credits: doc.credits };
}

async function addCredits(studentId, amount) {
    logger.info({ studentId, amount }, 'Adding credits');
    const db = mongoose.connection.db;
    const coll = db.collection('grades');
    const now = new Date();

    const result = await coll.findOneAndUpdate(
        { studentId, courseName: COURSE },
        [
            {
                $set: {
                    studentId: studentId,
                    courseName: COURSE,
                    overallPercentage: { $ifNull: ["$overallPercentage", 0] },
                    grade: { $ifNull: ["$grade", "N/A"] },
                    credits: {
                        $add: [{ $ifNull: ["$credits", CREDITS_DEFAULT] }, amount]
                    },
                    timestamp: now
                }
            }
        ],
        { upsert: true, returnDocument: 'after', returnOriginal: false }
    );

    const doc = result && result.value ? result.value : result;
    logger.info({ studentId, credits: doc.credits }, 'Credits added');
    return { studentId: doc.studentId, credits: doc.credits };
}

module.exports = { getCredits, deductCredit, addCredits };
