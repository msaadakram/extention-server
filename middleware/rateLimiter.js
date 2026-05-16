const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for grade save endpoint.
 * 30 requests per minute per IP — writes are relatively expensive.
 */
const gradeSaveLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        details: 'Please wait before saving grades again'
    }
});

/**
 * Rate limiter for read endpoints (leaderboard, check-student, timetable).
 * 60 requests per minute per IP.
 */
const readLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        details: 'Please wait before requesting data again'
    }
});

/**
 * Rate limiter for timetable save.
 * 30 requests per minute per IP.
 */
const timetableSaveLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        details: 'Please wait before saving timetable again'
    }
});

module.exports = {
    gradeSaveLimiter,
    readLimiter,
    timetableSaveLimiter
};
