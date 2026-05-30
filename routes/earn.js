"use strict";

const express = require("express");
const crypto = require("crypto");
const pino = require("pino");

const RewardToken = require("../models/RewardToken");
const { earnGenerateLimiter } = require("../middleware/earnRateLimiter");
const { generateTokenSchema } = require("../validators/earnValidator");
const creditService = require("../services/creditService");

const router = express.Router();
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const CUTY_API_TOKEN = process.env.CUTY_API_TOKEN || "";
const CUTY_API_BASE_URL = process.env.CUTY_API_BASE_URL || "https://cuty.io/api";
const CREDITS_REWARD = Number(process.env.CREDITS_REWARD) || 50;

async function shortenUrl(longUrl) {
  if (!CUTY_API_TOKEN) {
    return { shortUrl: longUrl, usedCuty: false, error: "CUTY_API_TOKEN missing" };
  }

  if (typeof fetch !== "function") {
    return { shortUrl: longUrl, usedCuty: false, error: "fetch unavailable" };
  }

  const apiUrl =
    CUTY_API_BASE_URL +
    "?api=" + encodeURIComponent(CUTY_API_TOKEN) +
    "&url=" + encodeURIComponent(longUrl);

  try {
    const resp = await fetch(apiUrl, { method: "GET" });
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
    return { shortUrl: longUrl, usedCuty: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// POST /api/earn/generate-token
// ---------------------------------------------------------------------------
router.post("/generate-token", earnGenerateLimiter, async (req, res) => {
  try {
    // Validate body
    const { error, value } = generateTokenSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
        code: "VALIDATION_ERROR",
        details: error.details,
      });
    }

    const { userId } = value;

    // Generate cryptographically secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Persist token
    await RewardToken.create({ token, userId });

    logger.info({ userId }, "Token generated");

    const longUrl = `${BASE_URL}/token/${token}`;
    const shortResult = await shortenUrl(longUrl);

    if (!shortResult.usedCuty && shortResult.error) {
      logger.warn({ userId, error: shortResult.error }, "Cuty shorten failed");
    }

    return res.status(201).json({
      shortUrl: shortResult.shortUrl,
      token,
    });
  } catch (err) {
    logger.error(err, "Error generating token");
    return res.status(500).json({
      error: "Failed to generate token",
      code: "INTERNAL_ERROR",
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/earn/verify/:token
// ---------------------------------------------------------------------------
router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Validate param exists
    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return res.status(400).json({
        error: "Token is required",
        code: "VALIDATION_ERROR",
      });
    }

    // Find token in DB
    const rewardToken = await RewardToken.findOne({ token: token.trim() });

    if (!rewardToken) {
      return res.status(404).json({
        error: "Token not found or expired",
        code: "TOKEN_NOT_FOUND",
      });
    }

    if (rewardToken.used) {
      return res.status(400).json({
        error: "Token has already been used",
        code: "TOKEN_ALREADY_USED",
      });
    }

    // Add credits to the creditService system (uses '__credits__' courseName)
    // This is the same system the extension reads via GET /api/credits/:studentId
    const creditResult = await creditService.addCredits(rewardToken.userId, CREDITS_REWARD);

    // Mark token as used
    rewardToken.used = true;
    await rewardToken.save();

    logger.info(
      { userId: rewardToken.userId, credits: creditResult.credits },
      "Credits rewarded"
    );

    return res.json({
      success: true,
      message: "Credits added successfully",
      credits: creditResult.credits,
    });
  } catch (err) {
    logger.error(err, "Error verifying token");
    return res.status(500).json({
      error: "Failed to verify token",
      code: "INTERNAL_ERROR",
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/earn/credits/:userId
// ---------------------------------------------------------------------------
router.get("/credits/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      return res.status(400).json({
        error: "userId is required",
        code: "VALIDATION_ERROR",
      });
    }

    const result = await creditService.getCredits(userId.trim());

    return res.json({
      userId: userId.trim(),
      credits: result.credits,
    });
  } catch (err) {
    logger.error(err, "Error fetching credits");
    return res.status(500).json({
      error: "Failed to fetch credits",
      code: "INTERNAL_ERROR",
    });
  }
});

module.exports = router;
