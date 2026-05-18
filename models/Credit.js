const mongoose = require('mongoose');

const CreditSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    credits: { type: Number, default: 10, min: 0 },
    lastReset: { type: Date, default: Date.now }
});

CreditSchema.index({ studentId: 1 }, { unique: true });

module.exports = mongoose.models.Credit || mongoose.model('Credit', CreditSchema);
