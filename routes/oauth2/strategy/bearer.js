"use strict";

var db = require('../../../models');
var BearerStrategy = require('passport-http-bearer').Strategy;
var jwtHelper = require('../../../lib/jwt-helper');
var logger = require('../../../lib/logger');

exports.bearer = new BearerStrategy(function (accessToken, done) {
    var clientId = jwtHelper.read(accessToken).cli;
    db.OAuth2Client.find({where: {id: clientId}}).then(
        function (client) {
            if (!client) {
                return done(null, false);
            }

            var userId;
            try {
                userId = jwtHelper.getUserId(accessToken, client.jwt_code);
            } catch (e) {
                if (e.name === 'TokenExpiredError' && e.message === 'jwt expired') {
                    return done(null, false, e);
                } else {
                    return done(e);
                }
            }
            if (userId) {
                db.User.findOne({where: {id: userId}, include: db.LocalLogin}).then(
                    user => {
                        if (!user) {
                            return done(null, false);
                        }
                        // TODO: Define scope
                        const info = {scope: '*', client: client};
                        return done(null, user, info);
                    }
                ).catch(done);
            } else {
                // TODO: Define scope
                const info = {scope: '*', client: client};
                return done(null, client, info);
            }
        }
    ).catch(done);
});
