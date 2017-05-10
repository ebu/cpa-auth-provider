"use strict";

var db = require('../../../models');
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var logger = require('../../../lib/logger');
var promise = require('bluebird');
var bcrypt = promise.promisifyAll(require('bcrypt'));

exports.client_password_strategy = new ClientPasswordStrategy(
    function (clientId, clientSecret, done) {
        db.OAuth2Client.findOne({where: {client_id: clientId}}).then(function (client) {
            logger.debug('[ClientPassword][client_id', clientId, ']');
            if (!client) {
                return done(null, false);
            }
            if (bcrypt.compareSync(clientSecret, client.client_secret)) {
                return done(null, false);
            }
            return done(null, client);
        }).catch(function (err) {
            logger.debug('[ClientPassword][Error', err, ']');
            return done(err);
        });
    }
);