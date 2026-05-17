const Joi = require('joi');

const assessmentSchema = Joi.object({
    name: Joi.string().trim().required(),
    totalMarks: Joi.number().min(0).required(),
    obtainedMarks: Joi.number().min(0).required(),
    percentage: Joi.number().min(0).max(100).required(),
    weightage: Joi.number().min(0).max(100).required(),
    classAverage: Joi.number().min(0).allow(null).optional()
});

/**
 * Schema for POST /api/save-grades request body.
 * Matches the original API contract exactly.
 */
const saveGradesSchema = Joi.object({
    studentID: Joi.string().trim().allow('').optional().default('unknown'),
    studentName: Joi.string().trim().allow('').optional().default(''),
    studentImage: Joi.string().allow('').optional().default(''),
    privacyMode: Joi.boolean().optional().default(false),
    hideName: Joi.boolean().optional().default(false),
    hidePhoto: Joi.boolean().optional().default(false),
    courseName: Joi.string().trim().min(1).required().messages({
        'string.empty': 'courseName is required',
        'any.required': 'courseName is required'
    }),
    courseCode: Joi.string().trim().allow('').optional().default(''),
    assessments: Joi.array().items(assessmentSchema).optional().default([]),
    classAverage: Joi.number().min(0).allow(null).optional(),
    overallPercentage: Joi.number().min(0).max(100).required().messages({
        'any.required': 'overallPercentage is required'
    }),
    grade: Joi.string().trim().min(1).required().messages({
        'string.empty': 'grade is required',
        'any.required': 'grade is required'
    })
}).options({ stripUnknown: true });

/**
 * Schema for GET /api/leaderboard query parameters.
 */
const leaderboardQuerySchema = Joi.object({
    courseName: Joi.string().trim().min(1).required().messages({
        'string.empty': 'courseName query parameter is required',
        'any.required': 'courseName query parameter is required'
    }),
    studentId: Joi.string().trim().allow('').optional()
});

module.exports = {
    saveGradesSchema,
    leaderboardQuerySchema
};
