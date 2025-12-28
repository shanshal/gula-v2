'use strict';

const ApiError = require('../utils/ApiError');

module.exports = function internalAuth(req, res, next) {
    const expected = process.env.INTERNAL_ACCESS_TOKEN;

    if (!expected) {
        console.error('[image-service/internalAuth] INTERNAL_ACCESS_TOKEN is not set');
        return next(new ApiError(500, 'Internal auth not configured'));
    }

    const raw =
        req.get('x-internal-access-token') ||
        req.get('X-Internal-Access-Token') ||
        req.get('authorization');

    if (!raw) {
        return next(new ApiError(401, 'Missing internal access token'));
    }

    const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
    if (token !== expected) {
        return next(new ApiError(401, 'Invalid internal access token'));
    }

    return next();
};