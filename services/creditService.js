const mongoose = require('mongoose');
const pino = require('pino');

const logger = pino({ name: 'creditService' });
const CREDITS_DEFAULT = 10;

// Store credits in 'grades' collection (no new collection = no limit hit)
const COURSE = '__credits__';

async function _getOrCreate(studentId) {
    const db = mongoose.connection.db;
    if (!db) throw new Error('No database connection');

    const coll = db.collection('grades');

    // Try find existing
    let doc = null;
    try {
        doc = await coll.findOne({ studentId, courseName: COURSE });
    } catch (e) {
        logger.error({ err: e }, 'findOne failed in _getOrCreate');
        throw e;
    }

    if (!doc) {
        try {
            await coll.insertOne({
                studentId,
                courseName: COURSE,
                overallPercentage: 0,
                grade: 'N/A',
                credits: CREDITS_DEFAULT,
                timestamp: new Date()
            });
            doc = { studentId, courseName: COURSE, credits: CREDITS_DEFAULT };
        } catch (e) {
            // Duplicate key race - try find again
            if (e.code === 11000) {
                doc = await coll.findOne({ studentId, courseName: COURSE });
            } else {
                logger.error({ err: e }, 'insertOne failed in _getOrCreate');
                throw e;
            }
        }
    }

    if (!doc) {
        throw new Error('Failed to get or create credit record for ' + studentId);
    }

    if (doc.credits === undefined || doc.credits === null) {
        doc.credits = CREDITS_DEFAULT;
    }

    return doc;
}

async function getCredits(studentId) {
    logger.info({ studentId }, 'Fetching credits');
    const doc = await _getOrCreate(studentId);
    return { studentId: doc.studentId, credits: doc.credits };
}

async function deductCredit(studentId) {
    logger.info({ studentId }, 'Deducting credit');
    const doc = await _getOrCreate(studentId);
    const newCredits = Math.max(0, (doc.credits || 0) - 1);

    const db = mongoose.connection.db;
    await db.collection('grades').updateOne(
        { _id: doc._id },
        { $set: { credits: newCredits, timestamp: new Date() } }
    );

    logger.info({ studentId, credits: newCredits }, 'Credit deducted');
    return { studentId: doc.studentId, credits: newCredits };
}

async function addCredits(studentId, amount) {
    logger.info({ studentId, amount }, 'Adding credits');
    const doc = await _getOrCreate(studentId);
    const newCredits = (doc.credits || 0) + amount;

    const db = mongoose.connection.db;
    await db.collection('grades').updateOne(
        { _id: doc._id },
        { $set: { credits: newCredits, timestamp: new Date() } }
    );

    logger.info({ studentId, credits: newCredits }, 'Credits added');
    return { studentId: doc.studentId, credits: newCredits };
}

module.exports = { getCredits, deductCredit, addCredits };
