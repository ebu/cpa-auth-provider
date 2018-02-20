"use strict";

var db = require('../../../models');
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var logger = require('../../../lib/logger');
var bcrypt = require('bcrypt');

exports.client_password_strategy = new ClientPasswordStrategy(
    function (clientId, clientSecret, done) {
        let client;
        db.OAuth2Client.findOne({where: {client_id: clientId}}).then(
            function (client_) {
                client = client_;
                logger.debug('[ClientPassword][client_id', clientId, ']');
                if (!client) {
                    return done(null, false);
                }
                return bcrypt.compare(clientSecret, client.client_secret);
            }
        ).then(
            function (result) {
                if (result) {
                    return done(null, client);
                } else {
                    return done(null, false);
                }
            }
        ).catch(
            function (err) {
                logger.debug('[ClientPassword][Error', err, ']');
                return done(err);
            }
        );
    }
);