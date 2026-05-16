const pino = require('pino');

const logger = pino({ name: 'http' });

/**
 * Structured request logging middleware.
 * Logs method, path, status code, and response duration for every request.
 */
function requestLogger(req, res, next) {
    const start = Date.now();

    // Hook into response finish to capture status and timing
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            method: req.method,
            path: req.originalUrl || req.url,
            status: res.statusCode,
            durationMs: duration
        }, `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${duration}ms`);
    });

    next();
}

module.exports = requestLogger;
