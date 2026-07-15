const Joi = require('joi');

const adminLoginSchema = Joi.object({
    username: Joi.string().trim().min(1).max(64).required(),
    password: Joi.string().min(1).max(128).required()
});

module.exports = { adminLoginSchema };
