const mongoose = require('mongoose');

// Store privacy settings in existing 'grades' collection to avoid 500-collection M0 limit
// We use courseName: '__privacy__' to distinguish from grade docs
const COLLECTION = 'grades';

const PrivacySchema = new mongoose.Schema(
    {
        studentId: { type: String, required: true },
        hideName: { type: Boolean, default: false },
        hidePhoto: { type: Boolean, default: false },
        updatedAt: { type: Date, default: Date.now },
        courseName: { type: String, default: '__privacy__' },
        overallPercentage: { type: Number, default: 0 },
        grade: { type: String, default: 'N/A' }
    },
    { collection: COLLECTION, strict: false }
);

PrivacySchema.index({ studentId: 1, courseName: 1 }, { unique: true, sparse: true });
PrivacySchema.index({ updatedAt: 1 });

module.exports = mongoose.models.Privacy || mongoose.model('Privacy', PrivacySchema);
