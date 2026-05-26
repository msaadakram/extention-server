const pino = require('pino');
const Privacy = require('../models/Privacy');

const logger = pino({ name: 'privacyService' });
const COURSE = '__privacy__';

async function getPrivacy(studentId) {
    try {
        const doc = await Privacy.findOne({ studentId, courseName: COURSE }).lean();
        if (!doc) {
            return { studentId, hideName: false, hidePhoto: false, updatedAt: null };
        }
        return {
            studentId: doc.studentId,
            hideName: !!doc.hideName,
            hidePhoto: !!doc.hidePhoto,
            updatedAt: doc.updatedAt || null
        };
    } catch (err) {
        logger.error({ err, studentId }, 'getPrivacy failed');
        throw err;
    }
}

async function setPrivacy(studentId, hideName, hidePhoto) {
    const updatedAt = new Date();
    try {
        const doc = await Privacy.findOneAndUpdate(
            { studentId, courseName: COURSE },
            { $set: { hideName: !!hideName, hidePhoto: !!hidePhoto, updatedAt } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        return {
            studentId: doc.studentId,
            hideName: !!doc.hideName,
            hidePhoto: !!doc.hidePhoto,
            updatedAt: doc.updatedAt || updatedAt
        };
    } catch (err) {
        logger.error({ err, studentId }, 'setPrivacy failed');
        throw err;
    }
}

async function getPrivacyMap(studentIds) {
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return new Map();
    }

    try {
        const docs = await Privacy.find({ studentId: { $in: studentIds }, courseName: COURSE }).lean();
        const map = new Map();
        docs.forEach((doc) => {
            map.set(doc.studentId, {
                hideName: !!doc.hideName,
                hidePhoto: !!doc.hidePhoto
            });
        });
        return map;
    } catch (err) {
        logger.error({ err, count: studentIds.length }, 'getPrivacyMap failed');
        throw err;
    }
}

module.exports = { getPrivacy, setPrivacy, getPrivacyMap };
