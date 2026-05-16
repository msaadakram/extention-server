const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../middleware/validate');
const { gradeSaveLimiter, readLimiter } = require('../middleware/rateLimiter');
const { saveGradesSchema, leaderboardQuerySchema } = require('../validators/gradeValidator');
const gradeService = require('../services/gradeService');
const pino = require('pino');

const logger = pino({ name: 'grades' });

/**
 * POST /api/save-grades
 * Save a grade entry. Dual-writes to shared 'grades' collection and
 * per-student collection using a MongoDB transaction.
 */
router.post('/save-grades', gradeSaveLimiter, validate(saveGradesSchema), async (req, res, next) => {
    try {
        const result = await gradeService.saveGrade(req.body);
        res.status(201).json({ message: 'Saved successfully' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/leaderboard
 * Fetch leaderboard for a course, scoped to a student's classmates
 * (via SubjectGroup).
 */
router.get('/leaderboard', readLimiter, validateQuery(leaderboardQuerySchema), async (req, res, next) => {
    try {
        const { courseName, studentId } = req.query;
        const grades = await gradeService.getLeaderboard(courseName, studentId || null);
        res.json(grades);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
