"use strict";

const Joi = require("joi");

const generateTokenSchema = Joi.object({
  userId: Joi.string().trim().min(1).required(),
});

module.exports = { generateTokenSchema };
