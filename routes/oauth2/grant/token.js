"use strict";

var oauthToken = require('../../../lib/oauth2-token');
var userDeletion = require('../../../lib/user-deletion');

// Grant implicit authorization.  The callback takes the `client` requesting
// authorization, the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a token, which is bound to these
// values.

exports.token = function (client, user, ares, done) {
    try {
        var accessToken, extras;
        oauthToken.generateAccessToken(client, user).then(
            function (_accessToken) {
                accessToken = _accessToken;
                return oauthToken.generateTokenExtras(client, user);
            }
        ).then(
            function (_extras) {
                extras = _extras;
                return userDeletion.cancelDeletion(user, client);
            }
        ).then(
            function (deletionCancelled) {
                if (deletionCancelled) {
                    extras.deletion_cancelled = true;
                }
                return done(null, accessToken, extras);
            }
        ).catch(
            function (e) {
                return done(e);
            }
        );
    } catch (e) {
        return done(e);
    }
};