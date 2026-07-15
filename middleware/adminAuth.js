const adminAuthService = require('../services/adminAuthService');

function getTokenFromRequest(req) {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }
    if (req.cookies && req.cookies.admin_token) {
        return req.cookies.admin_token;
    }
    return null;
}

async function requireAdmin(req, res, next) {
    try {
        const token = getTokenFromRequest(req);
        const session = await adminAuthService.validateToken(token);
        if (!session) {
            return res.status(401).json({
                error: 'Unauthorized',
                code: 'ADMIN_AUTH_REQUIRED'
            });
        }
        req.admin = session;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { requireAdmin, getTokenFromRequest };
