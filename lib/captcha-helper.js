"use strict";

var config = require('../config');
var recaptcha = require('express-recaptcha');

if (config.recaptcha.enabled) {
    // Google reCAPTCHA
    recaptcha.init(config.recaptcha.site_key, config.recaptcha.secret_key);
}

module.exports = {

    recaptchaVerify: function (req, res, next) {
        if (config.recaptcha.enabled) {
            recaptcha.middleware.verify(req, res, next);
        } else {
            req.recaptcha = {};
            next();
        }
    }

};

