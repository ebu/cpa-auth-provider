"use strict";

var db = require('../../../models');
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;

exports.client_password_strategy = new ClientPasswordStrategy(
    function (clientId, clientSecret, done) {
        db.OAuth2Client.find({where: {client_id: clientId}}).then(function (client) {
            console.log('[ClientPassword][client_id', clientId, ']');
            if (!client) {
                return done(null, false);
            }
            if (client.client_secret != clientSecret) {
                return done(null, false);
            }
            return done(null, client);
        }).catch(function(err) {
            console.log('[ClientPassword][Error', err, ']');
            return done(err);
		});
    }
);