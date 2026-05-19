const express = require('express');
const router = express.Router();
const { validate, validateParams } = require('../middleware/validate');
const { gradeSaveLimiter, readLimiter } = require('../middleware/rateLimiter');
const { deductCreditSchema, getCreditsParamsSchema } = require('../validators/creditValidator');
const creditService = require('../services/creditService');
const pino = require('pino');

const logger = pino({ name: 'credits' });

/**
 * GET /api/credits/:studentId
 * Fetch the current credit balance for a student.
 */
router.get('/credits/:studentId', readLimiter, validateParams(getCreditsParamsSchema), async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const result = await creditService.getCredits(studentId);
        res.json(result);
    } catch (error) {
        logger.error({ err: error, studentId: req.params.studentId }, 'credits GET failed');
        next(error);
    }
});

/**
 * POST /api/credits/deduct
 * Deduct one credit from a student's balance.
 */
router.post('/credits/deduct', gradeSaveLimiter, validate(deductCreditSchema), async (req, res, next) => {
    try {
        const { studentId } = req.body;
        const result = await creditService.deductCredit(studentId);
        res.json(result);
    } catch (error) {
        logger.error({ err: error, body: req.body }, 'credits POST deduct failed');
        next(error);
    }
});

module.exports = router;
