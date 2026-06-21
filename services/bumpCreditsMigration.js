"use strict";

const { COURSE_NAMES, DEFAULTS } = require('../config/constants');

const CREDITS_COURSE = COURSE_NAMES.CREDITS;
const CREDITS_DEFAULT = DEFAULTS.CREDITS_DEFAULT;

async function migrateBumpCredits(db) {
    const gradesColl = db.collection('grades');
    const records = await gradesColl.find({ courseName: CREDITS_COURSE }).toArray();
    const belowThreshold = records.filter(r => (r.credits || 0) < CREDITS_DEFAULT);

    let bumped = 0;
    for (const r of belowThreshold) {
        await gradesColl.updateOne(
            { _id: r._id },
            { $set: { credits: CREDITS_DEFAULT, timestamp: new Date() } }
        );
        bumped++;
    }

    return { total: records.length, belowThreshold: belowThreshold.length, bumped };
}

module.exports = { migrateBumpCredits };
