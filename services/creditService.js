const Credit = require('../models/Credit');
const pino = require('pino');

const logger = pino({ name: 'creditService' });

/**
 * Get credits for a student.
 * If no record exists, create one with the default of 10 credits.
 *
 * @param {string} studentId
 * @returns {Promise<{ studentId: string, credits: number }>}
 */
async function getCredits(studentId) {
    logger.info({ studentId }, 'Fetching credits');

    let record = await Credit.findOne({ studentId });

    if (!record) {
        logger.info({ studentId }, 'No credit record found, creating with default');
        record = await Credit.create({ studentId, credits: 10 });
    }

    return { studentId: record.studentId, credits: record.credits };
}

/**
 * Deduct one credit from a student's balance.
 * Will not go below 0.
 *
 * @param {string} studentId
 * @returns {Promise<{ studentId: string, credits: number }>}
 */
async function deductCredit(studentId) {
    logger.info({ studentId }, 'Deducting credit');

    let record = await Credit.findOne({ studentId });

    if (!record) {
        logger.info({ studentId }, 'No credit record found, creating with default then deducting');
        record = await Credit.create({ studentId, credits: 10 });
    }

    if (record.credits > 0) {
        record.credits -= 1;
        await record.save();
    }

    logger.info({ studentId, credits: record.credits }, 'Credit deducted');

    return { studentId: record.studentId, credits: record.credits };
}

/**
 * Add credits to a student's balance.
 * If no record exists, create one with the default plus the given amount.
 *
 * @param {string} studentId
 * @param {number} amount — positive integer
 * @returns {Promise<{ studentId: string, credits: number }>}
 */
async function addCredits(studentId, amount) {
    logger.info({ studentId, amount }, 'Adding credits');

    let record = await Credit.findOne({ studentId });

    if (!record) {
        logger.info({ studentId, amount }, 'No credit record found, creating with default + amount');
        record = await Credit.create({ studentId, credits: 10 + amount });
    } else {
        record.credits += amount;
        await record.save();
    }

    logger.info({ studentId, credits: record.credits }, 'Credits added');

    return { studentId: record.studentId, credits: record.credits };
}

module.exports = {
    getCredits,
    deductCredit,
    addCredits
};
