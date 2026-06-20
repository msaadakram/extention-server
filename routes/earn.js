"use strict";

const express = require("express");
const pino = require("pino");

const RewardToken = require("../models/RewardToken");
const { earnGenerateLimiter, earnVerifyLimiter } = require("../middleware/earnRateLimiter");
const { validate, validateParams, validateQuery } = require("../middleware/validate");
const {
  generateTokenSchema,
  verifyTokenParamsSchema,
  verifyTokenQuerySchema,
  creditsParamsSchema,
} = require("../validators/earnValidator");
const creditService = require("../services/creditService");
const {
  buildTokenUrl,
  generateAccessKey,
  shortenUrl,
  getReusableToken,
  upsertTokenForUser
} = require("../services/earnTokenService");
const { DEFAULTS } = require("../config/constants");

const router = express.Router();
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});


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

    const reusableToken = await getReusableToken(userId);
    if (reusableToken && reusableToken.token) {
      let accessKey = reusableToken.accessKey;
      if (!accessKey) {
        accessKey = generateAccessKey();
        reusableToken.accessKey = accessKey;
        reusableToken.shortUrl = "";
      }

      const existingLongUrl = buildTokenUrl(reusableToken.token, accessKey);
      if (reusableToken.shortUrl) {
        return res.status(200).json({
          shortUrl: reusableToken.shortUrl,
          reused: true,
        });
      }

      const shortResult = await shortenUrl(existingLongUrl);
      if (!shortResult.usedCuty) {
        if (shortResult.error) {
          logger.warn({ userId, error: shortResult.error }, "Cuty shorten failed");
        }
        await reusableToken.save();
        return res.status(503).json({
          error: "Shortener unavailable. Please try again later.",
          code: "SHORTENER_UNAVAILABLE",
        });
      }

      reusableToken.shortUrl = shortResult.shortUrl;
      await reusableToken.save();

      return res.status(200).json({
        shortUrl: shortResult.shortUrl,
        reused: true,
      });
    }

    // Generate cryptographically secure token (one active token per user)
    const tokenDoc = await upsertTokenForUser(userId, 3);
    const token = tokenDoc.token;
    const accessKey = tokenDoc.accessKey || generateAccessKey();
    if (!tokenDoc.accessKey) {
      tokenDoc.accessKey = accessKey;
    }

    const longUrl = buildTokenUrl(token, accessKey);

    const shortResult = await shortenUrl(longUrl);
    if (!shortResult.usedCuty) {
      if (shortResult.error) {
        logger.warn({ userId, error: shortResult.error }, "Cuty shorten failed");
      }
      await tokenDoc.save();
      return res.status(503).json({
        error: "Shortener unavailable. Please try again later.",
        code: "SHORTENER_UNAVAILABLE",
      });
    }

    tokenDoc.shortUrl = shortResult.shortUrl;
    await tokenDoc.save();

    logger.info({ userId }, "Token generated");

    return res.status(201).json({
      shortUrl: shortResult.shortUrl,
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
    const accessKey = req.query.key;

    // Validate param exists
    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return res.status(400).json({
        error: "Token is required",
        code: "VALIDATION_ERROR",
      });
    }

    if (!accessKey || typeof accessKey !== "string" || accessKey.trim().length === 0) {
      return res.status(400).json({
        error: "Access key is required",
        code: "ACCESS_KEY_REQUIRED",
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

    if (!rewardToken.accessKey || rewardToken.accessKey !== accessKey.trim()) {
      return res.status(403).json({
        error: "Invalid access key. Please open the short link to claim credits.",
        code: "ACCESS_KEY_INVALID",
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
    const creditResult = await creditService.addCredits(rewardToken.userId, DEFAULTS.CREDITS_REWARD);

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
