/* globals module,require */
"use strict";

var db = require('../models');
var config = require('../config');
var cors = require('cors');
const pwHelper = require('../lib/password-helper');

module.exports = function (router) {
    if (!config.quality_check || !config.quality_check.enabled) {
        return;
    }

    var cors_header = cors(corsDelegate);

    router.post(
        '/check/password',
        cors_header,
        function (req, res) {
            var password = req.body.password;
            let mail = req.body.mail;
            var quality = pwHelper.getQuality(mail, password);

            var messages = pwHelper.getWeaknesses(mail, password, req);
            let message = messages.length > 0 ? messages[0] : '';
            if (quality > 0) {
                res.status(200).json({accept: true, value: quality, message: message});
            } else {
                res.status(200).json({accept: false, value: quality, message: message});
            }
        }
    );

    router.post(
        '/check/username',
        cors_header,
        checkUsername
    );

};

function corsDelegate(req, callback) {
    var options = {origin: true};

    return callback(null, options);
}

function checkUsername(req, res, next) {
    db.User.find({include: {model: db.LocalLogin, where: {login: req.body.username}}})
        .then(
            function (user) {
                if (user) {
                    res.status(200).json({exists: true, available: false});
                } else {
                    res.status(200).json({exists: false, available: true});
                }
            },
            function () {
                res.status(500);
            }
        )
        .catch(
            function () {
                res.status(500);
            }
        );
}