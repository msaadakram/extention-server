const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { validate } = require('../middleware/validate');
const { timetableSaveLimiter, readLimiter } = require('../middleware/rateLimiter');
const { saveTimetableSchema } = require('../validators/timetableValidator');
const timetableService = require('../services/timetableService');
const pino = require('pino');

const logger = pino({ name: 'timetable' });

/**
 * POST /api/save-timetable
 * Save a student's timetable and rebuild SubjectGroup memberships.
 */
router.post('/save-timetable', timetableSaveLimiter, validate(saveTimetableSchema), async (req, res, next) => {
    try {
        const { studentID, timetable } = req.body;
        const result = await timetableService.saveTimetable(studentID, timetable);
        res.status(201).json({
            message: 'Timetable saved and student grouped successfully',
            entriesSaved: result.entriesSaved
        });
    } catch (error) {
        // Handle known service errors
        if (error.status) {
            return res.status(error.status).json({
                error: error.message,
                code: error.code || 'SERVICE_ERROR'
            });
        }
        next(error);
    }
});

/**
 * GET /api/timetable-leaderboard
 * Returns all timetable data.
 * Original behavior preserved: returns raw array of timetable documents.
 */
router.get('/timetable-leaderboard', readLimiter, async (req, res, next) => {
    try {
        const Timetable = mongoose.models.Timetable;
        if (!Timetable) {
            return res.json([]);
        }
        const data = await Timetable.find({}).lean();
        res.json(data);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
