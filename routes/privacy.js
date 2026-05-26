const express = require('express');
const router = express.Router();
const { validate, validateParams } = require('../middleware/validate');
const { gradeSaveLimiter, readLimiter } = require('../middleware/rateLimiter');
const { privacyUpdateSchema, privacyParamsSchema } = require('../validators/privacyValidator');
const privacyService = require('../services/privacyService');
const pino = require('pino');

const logger = pino({ name: 'privacy' });

/**
 * GET /api/privacy/:studentId
 * Fetch privacy settings for a student.
 */
router.get('/privacy/:studentId', readLimiter, validateParams(privacyParamsSchema), async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const result = await privacyService.getPrivacy(studentId);
        res.json(result);
    } catch (error) {
        logger.error({ err: error, studentId: req.params.studentId }, 'privacy GET failed');
        next(error);
    }
});

/**
 * POST /api/privacy
 * Update privacy settings for a student.
 */
router.post('/privacy', gradeSaveLimiter, validate(privacyUpdateSchema), async (req, res, next) => {
    try {
        const { studentId, hideName, hidePhoto } = req.body;
        const result = await privacyService.setPrivacy(studentId, hideName, hidePhoto);
        res.json(result);
    } catch (error) {
        logger.error({ err: error, body: req.body }, 'privacy POST failed');
        next(error);
    }
});

module.exports = router;
