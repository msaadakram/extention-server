function buildValidator(getTarget, setTarget) {
    return function validateWith(schema, options = {}) {
        return (req, res, next) => {
            const { error, value } = schema.validate(getTarget(req), {
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

            setTarget(req, value);
            next();
        };
    };
}

/**
 * Joi validation middleware factory.
 *
 * Usage:
 *   router.post('/path', validate(schema), handler);
 */
const validate = buildValidator(
    (req) => req.body,
    (req, value) => { req.body = value; }
);

/**
 * Validates req.query against the provided Joi schema.
 */
const validateQuery = buildValidator(
    (req) => req.query,
    (req, value) => { req.query = value; }
);

/**
 * Validates req.params against the provided Joi schema.
 */
const validateParams = buildValidator(
    (req) => req.params,
    (req, value) => { req.params = value; }
);

module.exports = { validate, validateQuery, validateParams };
