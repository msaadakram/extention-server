"use strict";

const Joi = require("joi");

const generateTokenSchema = Joi.object({
  userId: Joi.string().trim().min(1).required(),
});

const verifyTokenParamsSchema = Joi.object({
  token: Joi.string().trim().pattern(/^[a-f0-9]{64}$/i).required(),
});

const tokenPageParamsSchema = Joi.object({
  token: Joi.string().trim().pattern(/^[a-f0-9]{64}$/i).required(),
});

const verifyTokenQuerySchema = Joi.object({
  key: Joi.string().trim().pattern(/^[a-f0-9]{32}$/i).required(),
});

const creditsParamsSchema = Joi.object({
  userId: Joi.string().trim().min(1).required(),
});

module.exports = {
  generateTokenSchema,
  verifyTokenParamsSchema,
  verifyTokenQuerySchema,
  tokenPageParamsSchema,
  creditsParamsSchema,
};
