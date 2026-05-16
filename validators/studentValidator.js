const Joi = require('joi');

/**
 * Schema for GET /api/check-student/:studentId route params.
 */
const checkStudentParamsSchema = Joi.object({
    studentId: Joi.string().trim().min(1).required().messages({
        'string.empty': 'studentId parameter is required',
        'any.required': 'studentId parameter is required'
    })
});

module.exports = {
    checkStudentParamsSchema
};
