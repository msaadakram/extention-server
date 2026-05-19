const mongoose = require('mongoose');
const pino = require('pino');

const logger = pino({ name: 'creditService' });
const CREDITS_DEFAULT = 10;

/**
 * Get or create a credit document in the EXISTING 'grades' collection.
 * We store credits as a separate document with studentId + credits field
 * INSIDE the 'grades' collection to avoid MongoDB Atlas M0 500-collection limit.
 *
 * We use a special courseName prefix "__credits__" to distinguish from grade docs.
 */
const CREDITS_COURSE_NAME = '__credits__';

async function _getOrCreate(studentId) {
    const db = mongoose.connection.db;
    if (!db) throw new Error('No database connection');

    const collection = db.collection('grades');

    let doc = await collection.findOne({
        studentId: studentId,
        courseName: CREDITS_COURSE_NAME
    });

    if (!doc) {
        await collection.insertOne({
            studentId: studentId,
            courseName: CREDITS_COURSE_NAME,
            overallPercentage: 0,
            grade: 'N/A',
            credits: CREDITS_DEFAULT,
            timestamp: new Date()
        });
        doc = await collection.findOne({
            studentId: studentId,
            courseName: CREDITS_COURSE_NAME
        });
    }

    // Ensure credits field exists (migration from old format)
    if (doc && doc.credits === undefined) {
        await collection.updateOne(
            { _id: doc._id },
            { $set: { credits: CREDITS_DEFAULT } }
        );
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
