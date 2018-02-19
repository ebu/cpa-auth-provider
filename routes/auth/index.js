"use strict";

var db = require('../../models');
var config = require('../../config');
var authHelper = require('../../lib/auth-helper');
var requestHelper = require('../../lib/request-helper');
var trackingCookie = require('../../lib/tracking-cookie');

module.exports = function (router) {
    router.get('/logout', fullRedirect, function (req, res) {
        req.logout();
        requestHelper.redirect(res, '/');
    });

    router.get('/protected', authHelper.authenticateFirst, function (req, res) {
        res.send('protected');
    });

    router.get('/auth', fullRedirect, trackingCookie.middleware, function (req, res) {
        var autoIdpRedirect = config.auto_idp_redirect;

        if (authHelper.validRedirect(autoIdpRedirect, config.identity_providers)) {
            var url = '/auth/' + autoIdpRedirect;
            if (req.query && req.query.error) {
                url += "?error=" + req.query.error;
            }
            requestHelper.redirect(res, url);
            return;
        }

        res.render('./auth/provider_list.ejs');
    });

    authHelper.loadIdentityProviders(router, config.identity_providers);

};

function fullRedirect(req, res, next) {
    if (config.full_redirect) {
        return res.redirect(config.full_redirect);
    }
    return next();
}