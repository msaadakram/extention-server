const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate');
const { readLimiter, gradeSaveLimiter } = require('../middleware/rateLimiter');
const { requireAdmin, getTokenFromRequest } = require('../middleware/adminAuth');
const { adminLoginSchema } = require('../validators/adminValidator');
const adminAuthService = require('../services/adminAuthService');
const cookieService = require('../services/cookieService');
const { renderAdminPanelPage } = require('../services/adminPanelHtml');
const pino = require('pino');

const logger = pino({ name: 'admin' });

router.get('/', readLimiter, async (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderAdminPanelPage());
});

router.post('/api/login', gradeSaveLimiter, validate(adminLoginSchema), async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const result = await adminAuthService.login(username, password);
        if (!result) {
            return res.status(401).json({
                error: 'Invalid username or password',
                code: 'INVALID_CREDENTIALS'
            });
        }
        res.json({
            message: 'Login successful',
            token: result.token,
            username: result.username,
            expiresAt: result.expiresAt
        });
    } catch (error) {
        logger.error({ err: error }, 'admin login failed');
        next(error);
    }
});

router.post('/api/logout', readLimiter, async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);
        await adminAuthService.logout(token);
        res.json({ message: 'Logged out' });
    } catch (error) {
        next(error);
    }
});

router.get('/api/sessions', readLimiter, requireAdmin, async (req, res, next) => {
    try {
        const result = await cookieService.listCookieSessions({
            page: req.query.page,
            limit: req.query.limit,
            phase: req.query.phase,
            studentId: req.query.studentId
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.get('/api/sessions/:id', readLimiter, requireAdmin, async (req, res, next) => {
    try {
        const session = await cookieService.getCookieSessionById(req.params.id);
        if (!session) {
            return res.status(404).json({
                error: 'Session not found',
                code: 'SESSION_NOT_FOUND'
            });
        }
        res.json({
            session,
            export: cookieService.buildCookieExport(session)
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
