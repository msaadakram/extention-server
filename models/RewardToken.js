"use strict";

const mongoose = require("mongoose");

// Store tokens in existing 'grades' collection to avoid 500-collection M0 limit
// We use courseName: '__earn_token__' to distinguish from grade docs
const COLLECTION = "grades";

const rewardTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    userId: { type: String, required: true },
    accessKey: { type: String },
    shortUrl: { type: String },
    used: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    courseName: { type: String, default: "__earn_token__" },
    overallPercentage: { type: Number, default: 0 },
    grade: { type: String, default: "N/A" }
  },
  { collection: COLLECTION, strict: false }
);

rewardTokenSchema.index({ token: 1 }, { unique: true, sparse: true });
rewardTokenSchema.index({ userId: 1, courseName: 1 });
rewardTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600, sparse: true });

module.exports =
  mongoose.models.EarnToken ||
  mongoose.model("EarnToken", rewardTokenSchema);
