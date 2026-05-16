const Joi = require('joi');

const timetableEntrySchema = Joi.object({
    class: Joi.string().trim().allow('').optional().default(''),
    time: Joi.string().trim().min(1).required().messages({
        'string.empty': 'time is required for each timetable entry'
    }),
    teacher: Joi.string().trim().min(1).required().messages({
        'string.empty': 'teacher is required for each timetable entry'
    }),
    courseName: Joi.string().trim().min(1).required().messages({
        'string.empty': 'courseName is required for each timetable entry'
    }),
    day: Joi.string().trim().min(1).required().messages({
        'string.empty': 'day is required for each timetable entry'
    }),
    room: Joi.string().trim().allow('').optional().default('')
});

/**
 * Schema for POST /api/save-timetable request body.
 */
const saveTimetableSchema = Joi.object({
    studentID: Joi.string().trim().min(1).required().messages({
        'string.empty': 'studentID is required',
        'any.required': 'studentID is required'
    }),
    timetable: Joi.array().items(timetableEntrySchema).min(1).required().messages({
        'array.min': 'At least one valid timetable entry is required',
        'any.required': 'timetable array is required'
    })
});

module.exports = {
    saveTimetableSchema
};
