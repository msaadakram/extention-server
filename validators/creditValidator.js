const Joi = require('joi');

const deductCreditSchema = Joi.object({
    studentId: Joi.string().trim().min(1).required().messages({
        'string.empty': 'studentId is required',
        'any.required': 'studentId is required'
    })
});

const getCreditsParamsSchema = Joi.object({
    studentId: Joi.string().trim().min(1).required().messages({
        'string.empty': 'studentId is required',
        'any.required': 'studentId is required'
    })
});

module.exports = {
    deductCreditSchema,
    getCreditsParamsSchema
};
