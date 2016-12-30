"use strict";

var db = require('../../../models');
var BearerStrategy = require('passport-http-bearer').Strategy;
var jwtHelper = require('../../../lib/jwt-helper');

exports.bearer = new BearerStrategy(function (accessToken, done) {
    var userId = jwtHelper.getUserId(accessToken);
    if (userId) {
        db.User.find({where: {id: userId}}).then(
            function(user) {
                if (!user) {
                    return done(null, false);
                }
                // TODO: Define scope
                var info = {scope: '*'};
                done(null, user, info);
            }
        ).catch(done);
    } else {
        var clientId = jwtHelper.decode(accessToken).cli;
        db.OAuth2Client.find({where: {id: clientId}}).then(
            function(client) {
                if (!client) {
                    return done(null, false);
                }
                // TODO: Define scope
                var info = {scope: '*'};
                done(null, client, info);
            }
        ).catch(done);
    }
    //
    // db.AccessToken.find({where: {token: accessToken}}).then(function (token) {
    //     if (!token) {
    //         return done(null, false);
    //     }
	//
    //     if (token.user_id !== null) {
    //         db.User.find({where: {id: token.user_id}}).then(function (user) {
    //             if (!user) {
    //                 return done(null, false);
    //             }
    //             // TODO: Define scope
    //             var info = {scope: '*'};
    //             done(null, user, info);
    //         }).catch(done);
    //     } else {
    //         //The request came from a client only since userID is null
    //         //therefore the client is passed back instead of a user
    //         db.OAuth2Client.find({where: {id: token.client_id}}).then(function (client) {
    //             if (!client) {
    //                 return done(null, false);
    //             }
    //             // TODO: Define scope
    //             var info = {scope: '*'};
    //             done(null, client, info);
    //         }).catch(done);
    //     }
    // }).catch(done);
});
