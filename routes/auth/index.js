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

    router.get('/auth', recaptcha.middleware.render, trackingCookie.middleware, function (req, res) {
        var autoIdpRedirect = config.auto_idp_redirect;

        if (authHelper.validRedirect(autoIdpRedirect, config.identity_providers)) {
            var url = '/auth/' + autoIdpRedirect;
            if (req.query && req.query.error) {
                url += "?error=" + req.query.error;
            }
            if (req.session && req.session.auth_origin) {
                var myURL = new URL('http://example.org' + req.session.auth_origin);
                var clientId = myURL.searchParams.get('client_id');

                if (clientId === "db05acb0c6ed902e5a5b7f5ab79e7144") {
                    url = 'broadcaster/boutique-rts/custom-login-signup';
                }
                if (req.query && req.query.error) {
                    url += "?error=" + req.query.error;
                }
                
                var required = userHelper.getRequiredFields();
                var profileAttributes = {
                    email: req.query.email ? decodeURIComponent(req.query.email) : '',
                    captcha: req.recaptcha,
                    requiredFields: required,
                    message: req.flash('signupMessage')
                };
                for (var key in required) {
                    if (required.hasOwnProperty(key) && required[key]) {
                        profileAttributes[key] = req.query[key] ? decodeURIComponent(req.query[key]) : '';
                    }
                }

                profileAttributes.auth_origin = req.session.auth_origin;

                if (req.query && req.query.error) {
                    url += "?error=" + req.query.error;
                }

                res.render(url, profileAttributes);
                return;
            }

            requestHelper.redirect(res, url);
            return;
        }

        res.render('./auth/provider_list.ejs');
    });

    authHelper.loadIdentityProviders(router, config.identity_providers);

};
