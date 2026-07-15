const mongoose = require('mongoose');

const AdminSessionSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.AdminSession
    || mongoose.model('AdminSession', AdminSessionSchema, 'admin_sessions');
