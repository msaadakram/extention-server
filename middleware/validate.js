/**
 * Joi validation middleware factory.
 *
 * Usage:
 *   router.post('/path', validate(schema), handler);
 *
 * Validates req.body against the provided Joi schema.
 * On failure, returns 400 with structured error: { error, code, details }.
 */
function validate(schema, options = {}) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            ...options
        });

        if (error) {
            const details = error.details.map((d) => ({
                field: d.path.join('.'),
                message: d.message
            }));

            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details
            });
        }

        // Replace req.body with the sanitized+validated value
        req.body = value;
        next();
    };
}

/**
 * Validates req.query against the provided Joi schema.
 */
function validateQuery(schema, options = {}) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            ...options
        });

        if (error) {
            const details = error.details.map((d) => ({
                field: d.path.join('.'),
                message: d.message
            }));

            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details
            });
        }

        req.query = value;
        next();
    };
}

/**
 * Validates req.params against the provided Joi schema.
 */
function validateParams(schema, options = {}) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true,
            ...options
        });

        if (error) {
            const details = error.details.map((d) => ({
                field: d.path.join('.'),
                message: d.message
            }));

            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details
            });
        }

        req.params = value;
        next();
    };
}

module.exports = { validate, validateQuery, validateParams };
