"use strict";

const rateLimit = require("express-rate-limit");

// 10 requests per minute per IP for token generation
const earnGenerateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    error: "Too many requests, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

// 30 requests per minute per IP for token verification / token page
const earnVerifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    error: "Too many verification attempts, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

module.exports = { earnGenerateLimiter, earnVerifyLimiter };
