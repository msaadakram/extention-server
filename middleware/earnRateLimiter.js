"use strict";

const rateLimit = require("express-rate-limit");

// 10 requests per minute per IP for token generation
const earnGenerateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

module.exports = { earnGenerateLimiter };
