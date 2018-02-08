"use strict";

var config = require('../../config');
var db = require('../../models');
var oauth2Token = require('../../lib/oauth2-token');
var generate = require('../../lib/generate');
var emailUtil = require('../../lib/email-util');
const monitor = require('../../lib/monitor');

exports.createUser = createUser;

function createUser(req, res) {
    if (req.body.grant_type !== 'create_user') {
        return res.status(400).json(
            {
                error: oauth2Token.ERRORS.BAD_REQUEST.code,
                error_description: oauth2Token.ERRORS.BAD_REQUEST.message
            }
        );
    }

    if (!req.body.client_id) {
        return res.status(400).json(
            {
                error: oauth2Token.ERRORS.BAD_REQUEST.code,
                error_description: 'Missing fields. Please pass client_id.'
            }
        );
    }

    if (!req.body.username || !req.body.password) {
        return res.status(400).json(
            {
                error: oauth2Token.ERRORS.BAD_REQUEST.code,
                error_description: 'Missing fields. Please pass username and password.'
            }
        );
    }

    db.User.findOne({include: {model: db.LocalLogin, where: {login: req.body.username}}})
        .then(function (user) {
            if (user) {
                return res.status(400).json(
                    {
                        error: oauth2Token.ERRORS.USER_UNAVAILABLE.code,
                        error_description: oauth2Token.ERRORS.USER_UNAVAILABLE.message
                    }
                );
            } else {
                db.User.create(
                    {
                        email: req.body.username,
                        account_uid: generate.accountId()
                    }
                ).then(
                    function (user_) {
                        user = user_;
                        return db.LocalLogin.create({user_id: user.id, login: req.body.username});
                    }
                ).then(
                    function(localLogin) {
                        return localLogin.setPassword(req.body.password);
                    }
                ).then(
                    function (result) {
                        return sendSuccess(user, req, res);
                    }
                ).catch(
                    function (err) {
                        console.log(err);
                        res.status(500).json({error: 'Internal Error', error_description: err.message});
                    }
                );
            }
        }, function (error) {
            console.log(error);
            res.status(500).json({error: 'Internal Error', error_description: error.message});
        });
}

function sendSuccess(user, req, res) {
    var access_token, refresh_token, token_extras;
    var access_duration;
    var refresh_duration;
    var extras = req.body;
    var client;
    if (typeof extras === 'object') {
        access_duration = extras.access_duration * 1000;
        refresh_duration = extras.refresh_duration * 1000;
    }

    db.OAuth2Client.find({where: {client_id: req.body.client_id}}).then(
        function (_client) {
            client = _client;
            var redirectUri = req.body.redirect_uri || client.email_redirect_uri;
            if (!client.mayEmailRedirect(redirectUri)) {
                redirectUri = undefined;
            }
            emailUtil.sendVerifyEmail(user, req.hostname, client, redirectUri).then(
                function () {
                },
                function (e) {
                }
            );

            return oauth2Token.generateAccessToken(client, user, access_duration);
        }
    ).then(
        function (_access_token) {
            access_token = _access_token;
            return oauth2Token.generateRefreshToken(client, user, undefined, refresh_duration);
        }
    ).then(
        function (_refresh_token) {
            refresh_token = _refresh_token;
            return oauth2Token.generateTokenExtras(client, user, access_duration);

        }
    ).then(
        function (_token_extras) {
            token_extras = _token_extras;
            monitor.counter.inc(monitor.METRICS.ACCOUNT_CREATED, 1);
            return res.status(201).json(
                {
                    access_token: access_token,
                    refresh_token: refresh_token,
                    expires_in: token_extras.expires_in,
                    token_type: 'Bearer'
                }
            );
        }
    ).catch(
        function (e) {
            console.log(e);
            return res.status(500).json({error: 'Internal Error', error_description: e.message});
        }
    );
}
