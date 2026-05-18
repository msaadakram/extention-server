const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../middleware/validate');
const { gradeSaveLimiter, readLimiter } = require('../middleware/rateLimiter');
const { saveGradesSchema, leaderboardQuerySchema } = require('../validators/gradeValidator');
const gradeService = require('../services/gradeService');
const creditService = require('../services/creditService');
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

        // Credit check: if studentId is provided, verify they have credits
        if (studentId) {
            const creditRecord = await creditService.getCredits(studentId);
            if (creditRecord.credits < 1) {
                return res.status(402).json({
                    error: 'No credits remaining',
                    code: 'NO_CREDITS',
                    credits: 0
                });
            }
        }

        const grades = await gradeService.getLeaderboard(courseName, studentId || null);

        // Deduct a credit after successful leaderboard fetch
        if (studentId) {
            const updatedCredits = await creditService.deductCredit(studentId);
            res.json({ grades, remainingCredits: updatedCredits.credits });
        } else {
            res.json({ grades });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
