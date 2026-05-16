const pino = require('pino');

const logger = pino({ name: 'error' });

/**
 * Global error handler middleware.
 *
 * - Never leaks stack traces to the client.
 * - Returns structured error responses: { error, code, details? }
 * - Logs the full error internally for debugging.
 */
function errorHandler(err, req, res, _next) {
    // Log the full error with request context
    logger.error({
        err,
        method: req.method,
        path: req.originalUrl || req.url,
        body: req.body,
        query: req.query,
        params: req.params
    }, `Unhandled error: ${err.message}`);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const details = Object.values(err.errors || {}).map((e) => ({
            field: e.path,
            message: e.message
        }));
        return res.status(400).json({
            error: 'Database validation error',
            code: 'DB_VALIDATION_ERROR',
            details
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        return res.status(409).json({
            error: 'Duplicate entry',
            code: 'DUPLICATE_KEY',
            details: err.keyValue || undefined
        });
    }

    // JSON parse error (should be caught earlier, but as a fallback)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: 'Invalid JSON payload',
            code: 'INVALID_JSON'
        });
    }

    // Generic server error — never expose stack
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        code: 'INTERNAL_ERROR'
    });
}

module.exports = errorHandler;
