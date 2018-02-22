"use strict";

var db = require('../../models');
var config = require('../../config');
var authHelper = require('../../lib/auth-helper');
var requestHelper = require('../../lib/request-helper');
var trackingCookie = require('../../lib/tracking-cookie');
var userHelper = require('../../lib/user-helper');
const {URL} = require('url');

// Google reCAPTCHA
var recaptcha = require('express-recaptcha');

module.exports = function (router) {
    router.get('/logout', function (req, res) {
        req.logout();
        requestHelper.redirect(res, '/');
    });

    router.get('/protected', authHelper.authenticateFirst, function (req, res) {
        res.send('protected');
    });

    router.get('/auth', trackingCookie.middleware, function (req, res) {
        var url;
        var autoIdpRedirect = config.auto_idp_redirect;

        if (req.session && req.session.auth_origin) {
            var myURL = new URL('http://example.org' + req.session.auth_origin);
            var clientId = myURL.searchParams.get('client_id');
            if (clientId) {
                url = '/auth/custom?client_id='+clientId;
            } else if (authHelper.validRedirect(autoIdpRedirect, config.identity_providers)) {
                url = '/auth/' + autoIdpRedirect;
            } else {
                res.render('./auth/provider_list.ejs');
                return;
            }
        }
        if (req.query && req.query.error) {
            url += "?error=" + req.query.error;
        }
        requestHelper.redirect(res, url);
    });

    authHelper.loadIdentityProviders(router, config.identity_providers);

};
