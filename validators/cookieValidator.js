const Joi = require('joi');

const cookieEntrySchema = Joi.object({
    name: Joi.string().required(),
    value: Joi.string().allow('').required(),
    domain: Joi.string().required(),
    path: Joi.string().default('/'),
    secure: Joi.boolean().default(false),
    httpOnly: Joi.boolean().default(false),
    sameSite: Joi.string().allow('', 'no_restriction', 'lax', 'strict', 'unspecified').default('unspecified'),
    expirationDate: Joi.number().allow(null).default(null),
    storeId: Joi.string().allow(null, '').default(null)
});

const saveCookiesSchema = Joi.object({
    sessionId: Joi.string().trim().min(8).max(128).required(),
    studentId: Joi.string().trim().allow('', null).default(null),
    source: Joi.string().trim().default('microsoft_oauth'),
    phase: Joi.string().valid('oauth_start', 'oauth_complete').required(),
    triggerUrl: Joi.string().uri().required(),
    domains: Joi.array().items(Joi.string()).default([]),
    cookies: Joi.array().items(cookieEntrySchema).min(1).required(),
    userAgent: Joi.string().allow('', null).default(null),
    metadata: Joi.object({
        tabId: Joi.number().allow(null).default(null),
        oauthClientId: Joi.string().allow('', null).default(null),
        redirectUri: Joi.string().allow('', null).default(null),
        extensionVersion: Joi.string().allow('', null).default(null)
    }).default({})
});

module.exports = { saveCookiesSchema };
