"use strict";

const crypto = require("crypto");
const pino = require("pino");
const RewardToken = require("../models/RewardToken");
const { COURSE_NAMES, DEFAULTS } = require("../config/constants");

const logger = pino({ name: "earnTokenService" });

function buildTokenUrl(token, accessKey) {
  if (accessKey) {
    return `${DEFAULTS.BASE_URL}/token/${token}?key=${encodeURIComponent(accessKey)}`;
  }
  return `${DEFAULTS.BASE_URL}/token/${token}`;
}

function generateAccessKey() {
  return crypto.randomBytes(16).toString("hex");
}

async function fetchWithTimeout(url, options, timeoutMs) {
  if (typeof fetch !== "function") {
    throw new Error("fetch unavailable");
  }
  const controller = new AbortController();
  const timeout = setTimeout(function () {
    controller.abort();
  }, timeoutMs || DEFAULTS.CUTY_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function shortenUrl(longUrl) {
  if (!DEFAULTS.CUTY_API_TOKEN) {
    return { shortUrl: longUrl, usedCuty: false, error: "CUTY_API_TOKEN missing" };
  }

  const apiUrl =
    DEFAULTS.CUTY_API_BASE_URL +
    "?api=" + encodeURIComponent(DEFAULTS.CUTY_API_TOKEN) +
    "&url=" + encodeURIComponent(longUrl);

  try {
    const resp = await fetchWithTimeout(apiUrl, { method: "GET" }, DEFAULTS.CUTY_TIMEOUT_MS);
    const bodyText = await resp.text();
    let data = null;
    try {
      data = JSON.parse(bodyText);
    } catch (e) {
      data = null;
    }

    if (!resp.ok) {
      return {
        shortUrl: longUrl,
        usedCuty: false,
        error: (data && data.message) ? data.message : "Cuty HTTP " + resp.status,
      };
    }

    if (data && data.status === "success" && data.shortenedUrl) {
      return { shortUrl: data.shortenedUrl, usedCuty: true };
    }

    if (data && data.status === "error" && data.message) {
      return { shortUrl: longUrl, usedCuty: false, error: data.message };
    }

    return { shortUrl: longUrl, usedCuty: false, error: "Invalid Cuty response" };
  } catch (err) {
    const msg = err && err.name === "AbortError" ? "Cuty request timed out" : (err && err.message);
    return { shortUrl: longUrl, usedCuty: false, error: msg || "Cuty request failed" };
  }
}

async function getReusableToken(userId) {
  return RewardToken.findOne({
    userId,
    used: false,
    courseName: COURSE_NAMES.EARN_TOKEN,
    token: { $exists: true, $ne: "" },
  }).sort({ createdAt: -1 });
}

async function upsertTokenForUser(userId, maxAttempts) {
  const attempts = Number.isFinite(maxAttempts) ? maxAttempts : 3;
  let lastError = null;

  for (let i = 0; i < attempts; i += 1) {
    const token = crypto.randomBytes(32).toString("hex");
    const accessKey = generateAccessKey();

    try {
      const tokenDoc = await RewardToken.findOneAndUpdate(
        { userId, courseName: COURSE_NAMES.EARN_TOKEN },
        {
          $set: {
            token,
            accessKey,
            used: false,
            createdAt: new Date(),
            courseName: COURSE_NAMES.EARN_TOKEN,
            overallPercentage: 0,
            grade: "N/A",
          },
          $unset: {
            shortUrl: "",
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return tokenDoc;
    } catch (err) {
      lastError = err;
      if (err && err.code === 11000) {
        logger.warn({ userId, attempt: i + 1 }, "Duplicate token detected, retrying");
        continue;
      }
      throw err;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("Failed to generate a unique token");
}

module.exports = {
  buildTokenUrl,
  generateAccessKey,
  shortenUrl,
  getReusableToken,
  upsertTokenForUser
};
