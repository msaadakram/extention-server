const mongoose = require('mongoose');

const AdminUserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'admin' },
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: null }
});

module.exports = mongoose.models.AdminUser
    || mongoose.model('AdminUser', AdminUserSchema, 'admin_users');
