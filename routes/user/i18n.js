"use strict";

var config = require('../../config');
var authHelper = require('../../lib/auth-helper');


var routes = function (router) {

    router.post('/i18n', function (req, res) {

        if (req.body.lang) {
            res.cookie('lang', req.body.lang, {maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true}); // TODO Move cookie name and duration in config

            if (req.body.update_profile && req.body.update_profile === 'yes') {
                var user = authHelper.getAuthenticatedUser(req);
                if (!user) {
                    console.log("TODO update profile for user");
                }
            }
            return res.status(200).send();
        } else {
            return res.status(400).send();
        }


        //[authHelper.ensureAuthenticated, recaptcha.middleware.verify]

        // if (req.recaptcha.error)
        //     return res.status(400).json({msg: 'reCaptcha is empty or wrong. '});
        //
        // var user = authHelper.getAuthenticatedUser(req);
        // if (!user) {
        //     return res.status(403).send({success: false, msg: "not authenticated"});
        // } else {
        //     codeHelper.getOrGenereateEmailVerificationCode(user).then(function(code){
        //         emailHelper.send(
        //             config.mail.from,
        //             user.email,
        //             "validation-email",
        //             {log:true},
        //             {confirmLink: req.headers.origin + '/email_verify?email=' + encodeURIComponent(user.email) + '&code=' + encodeURIComponent(code), host:config.mail.host, mail:encodeURIComponent(user.email), code:encodeURIComponent(code)},
        //             config.mail.local
        //         ).then(
        //             function() {},
        //             function() {}
        //         );
        //     });
        //     return res.status(204).send();
        // }
    });


};

module.exports = routes;
