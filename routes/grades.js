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
 * Save a grade entry.
 */
router.post('/save-grades', gradeSaveLimiter, validate(saveGradesSchema), async (req, res, next) => {
    try {
        await gradeService.saveGrade(req.body);
        res.status(201).json({ message: 'Saved successfully' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/leaderboard
 * Fetch leaderboard for a course, scoped to a student's classmates (via SubjectGroup).
 * With studentId: checks + deducts credits.
 * Without studentId: bare fetch (no credit logic).
 */
router.get('/leaderboard', readLimiter, validateQuery(leaderboardQuerySchema), async (req, res, next) => {
    try {
        const { courseName, studentId } = req.query;

        // Only check/deduct credits when studentId is provided
        if (studentId) {
            try {
                const creditRecord = await creditService.getCredits(studentId);
                if (creditRecord.credits < 1) {
                    return res.status(402).json({
                        error: 'No credits remaining',
                        code: 'NO_CREDITS',
                        credits: 0
                    });
                }
            } catch (creditErr) {
                // If credit check fails (e.g. DB issue), log but don't block leaderboard
                logger.error({ err: creditErr, studentId }, 'Credit check failed, proceeding without deduction');
            }
        }

        const grades = await gradeService.getLeaderboard(courseName, studentId || null);

        // Deduct credit if studentId was provided and credit check passed
        if (studentId) {
            try {
                const updatedCredits = await creditService.deductCredit(studentId);
                return res.json({ grades, remainingCredits: updatedCredits.credits });
            } catch (deductErr) {
                logger.error({ err: deductErr, studentId }, 'Credit deduction failed');
                // Still return grades even if deduction failed
                return res.json({ grades });
            }
        }

        res.json({ grades });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
