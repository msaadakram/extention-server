"use strict";

const COURSE_NAMES = Object.freeze({
  CREDITS: "__credits__",
  PRIVACY: "__privacy__",
  EARN_USER: "__earn_user__",
  EARN_TOKEN: "__earn_token__"
});

const DEFAULTS = Object.freeze({
  CREDITS_DEFAULT: 10,
  CREDITS_REWARD: Number(process.env.CREDITS_REWARD) || 50,
  BASE_URL: process.env.BASE_URL || "http://localhost:3000",
  CUTY_API_TOKEN: process.env.CUTY_API_TOKEN || "",
  CUTY_API_BASE_URL: process.env.CUTY_API_BASE_URL || "https://cuty.io/api",
  CUTY_TIMEOUT_MS: Number(process.env.CUTY_TIMEOUT_MS) || 8000
});

module.exports = { COURSE_NAMES, DEFAULTS };
