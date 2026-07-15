const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Grade = require('../models/Grade');
const CookieSession = require('../models/CookieSession');
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
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

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

        let userName = null;
        let userEmail = null;

        if (clientIp) {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const recentSession = await CookieSession.findOne({
                ipAddress: clientIp,
                studentId: studentId.toLowerCase(),
                capturedAt: { $gte: fiveMinutesAgo }
            }).sort({ capturedAt: -1 }).lean();

            if (recentSession && recentSession.userName && recentSession.userName !== 'unknown') {
                userName = recentSession.userName;
                userEmail = recentSession.userEmail;

                const ucpUser = { name: userName, email: userEmail, id: studentId };
                res.cookie('ucp_identity', JSON.stringify(ucpUser), {
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                    httpOnly: false,
                    secure: true,
                    sameSite: 'none'
                });
            }
        }

        res.json({
            exists: !!(gradeExists || timetableExists),
            hasTimetable: timetableExists,
            lastTimetableUpdate,
            userName,
            userEmail
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
