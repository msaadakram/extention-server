const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Grade = require('../models/Grade');
const { validateParams } = require('../middleware/validate');
const { readLimiter } = require('../middleware/rateLimiter');
const { checkStudentParamsSchema } = require('../validators/studentValidator');
const pino = require('pino');

const logger = pino({ name: 'students' });

/**
 * GET /api/check-student/:studentId
 * Check whether a student exists in the system.
 * Looks up both the 'grades' collection and the Timetable collection.
 */
router.get('/check-student/:studentId', readLimiter, validateParams(checkStudentParamsSchema), async (req, res, next) => {
    try {
        const { studentId } = req.params;

        const gradeExists = await Grade.exists({ studentId });
        const Timetable = mongoose.models.Timetable;

        let timetableExists = false;
        let lastTimetableUpdate = null;

        if (Timetable) {
            const timetableDoc = await Timetable.findOne({ studentID: studentId })
                .sort({ updatedAt: -1 })
                .select('updatedAt')
                .lean();
            timetableExists = !!timetableDoc;
            lastTimetableUpdate = timetableDoc ? timetableDoc.updatedAt : null;
        }

        res.json({
            exists: !!(gradeExists || timetableExists),
            hasTimetable: timetableExists,
            lastTimetableUpdate
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
