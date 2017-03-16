"use strict";

var authHelper = {};

authHelper.ensureAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.send(401);
};

authHelper.authenticateFirst = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.auth_origin = req.originalUrl;

    res.redirect(res, '/');
};

authHelper.getAuthenticatedUser = function (req) {
    if (req.isAuthenticated()) {
        return req.user;
    }
    return null;
};

module.exports = authHelper;
