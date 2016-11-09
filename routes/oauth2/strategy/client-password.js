"use strict";

var db = require('../../../models');
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;

exports.client_password_strategy = new ClientPasswordStrategy(
    function (clientId, clientSecret, done) {
        db.OAuth2Client.find({where: {client_id: clientId}}).then(function (client) {
            if (!client) {
                return done(null, false);
            }
            if (client.client_secret != clientSecret) {
                return done(null, false);
            }
            return done(null, client);
        }).catch(done);
    }
);