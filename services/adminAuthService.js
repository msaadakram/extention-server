const crypto = require('crypto');
const AdminUser = require('../models/AdminUser');
const AdminSession = require('../models/AdminSession');
const pino = require('pino');

const logger = pino({ name: 'adminAuthService' });
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin';

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return salt + ':' + hash;
}

function verifyPassword(password, storedHash) {
    const parts = (storedHash || '').split(':');
    if (parts.length !== 2) return false;
    const salt = parts[0];
    const hash = parts[1];
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
    } catch (err) {
        return false;
    }
}

function createToken() {
    return crypto.randomBytes(32).toString('hex');
}

async function ensureDefaultAdmin() {
    const existing = await AdminUser.findOne({ username: DEFAULT_USERNAME });
    if (existing) return existing;

    const user = await AdminUser.create({
        username: DEFAULT_USERNAME,
        passwordHash: hashPassword(DEFAULT_PASSWORD),
        role: 'admin'
    });

    logger.info({ username: DEFAULT_USERNAME }, 'Default admin user created');
    return user;
}

async function login(username, password) {
    await ensureDefaultAdmin();

    const normalized = (username || '').trim().toLowerCase();
    const user = await AdminUser.findOne({ username: normalized });
    if (!user || !verifyPassword(password, user.passwordHash)) {
        return null;
    }

    const token = createToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await AdminSession.create({ token, username: user.username, expiresAt });
    await AdminUser.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

    return { token, username: user.username, expiresAt };
}

async function validateToken(token) {
    if (!token) return null;

    const session = await AdminSession.findOne({
        token,
        expiresAt: { $gt: new Date() }
    }).lean();

    if (!session) return null;
    return { username: session.username, token: session.token };
}

async function logout(token) {
    if (!token) return;
    await AdminSession.deleteOne({ token });
}

module.exports = {
    ensureDefaultAdmin,
    login,
    validateToken,
    logout,
    hashPassword,
    verifyPassword
};
