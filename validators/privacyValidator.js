const Joi = require('joi');

const privacyUpdateSchema = Joi.object({
    studentId: Joi.string().trim().min(1).required().messages({
        'string.empty': 'studentId is required',
        'any.required': 'studentId is required'
    }),
    hideName: Joi.boolean().required(),
    hidePhoto: Joi.boolean().required()
});

const privacyParamsSchema = Joi.object({
    studentId: Joi.string().trim().min(1).required().messages({
        'string.empty': 'studentId is required',
        'any.required': 'studentId is required'
    })
});

module.exports = {
    privacyUpdateSchema,
    privacyParamsSchema
};
