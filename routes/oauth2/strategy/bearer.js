"use strict";

var db = require('../../../models');
var BearerStrategy = require('passport-http-bearer').Strategy;
var jwtHelper = require('../../../lib/jwt-helper');
var logger = require('../../../lib/logger');

exports.bearer = new BearerStrategy(function (accessToken, done) {
    // logger.debug('[BearerStrategy][user_id', userId, ']');
    const clientId = jwtHelper.decode(accessToken).cli;
    db.OAuth2Client.findOne({where: {id: clientId}}).then(
        client => {
            if (!client) {
                return done(null, false);
            }

            const userId = jwtHelper.getUserId(accessToken);
            if (userId) {
                db.User.findOne({where: {id: userId}}).then(
                    user => {
                        if (!user) {
                            return done(null, false);
                        }
                        // TODO: Define scope
                        const info = {scope: '*', client};
                        done(null, user, info);
                    }
                );
            } else {
                const info = {scope: '*', client};
                done(null, client, info);
            }
        }

    );
});
