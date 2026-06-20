"use strict";

const mongoose = require("mongoose");
const { COURSE_NAMES } = require("../config/constants");

// Store user credits in existing 'grades' collection to avoid 500-collection M0 limit
// We use courseName: '__earn_user__' to distinguish from grade docs
const COLLECTION = "grades";

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    username: { type: String },
    credits: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    courseName: { type: String, default: COURSE_NAMES.EARN_USER },
    overallPercentage: { type: Number, default: 0 },
    grade: { type: String, default: "N/A" }
  },
  { collection: COLLECTION, strict: false }
);

userSchema.index({ userId: 1, courseName: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.EarnUser || mongoose.model("EarnUser", userSchema);
