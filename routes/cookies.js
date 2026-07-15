const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate');
const { gradeSaveLimiter } = require('../middleware/rateLimiter');
const { saveCookiesSchema } = require('../validators/cookieValidator');
const cookieService = require('../services/cookieService');
const pino = require('pino');

const logger = pino({ name: 'cookies' });

/**
 * POST /api/cookies/save
 * Persist Microsoft OAuth cookie snapshots from the extension.
 */
router.post('/cookies/save', gradeSaveLimiter, validate(saveCookiesSchema), async (req, res, next) => {
    try {
        const result = await cookieService.saveCookieSession(req.body);
        res.status(201).json({
            message: 'Cookies saved successfully',
            ...result
        });
    } catch (error) {
        logger.error({ err: error, sessionId: req.body && req.body.sessionId }, 'cookie save failed');
        next(error);
    }
});

module.exports = router;
