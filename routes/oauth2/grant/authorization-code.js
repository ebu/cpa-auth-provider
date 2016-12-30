"use strict";

var db = require('../../../models');
var generate = require('../../../lib/generate');

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes.  The callback takes the `client` requesting
// authorization, the `redirectURI` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a code, which is bound to these
// values, and will be exchanged for an access token.

exports.authorization_code = function (client, redirectURI, user, ares, done) {
    var code = generate.authorizationCode();

    db.OAuth2AuthorizationCode.create({
        authorization_code: code,
        oauth2_client_id: client.id,
        redirect_uri: redirectURI,
        user_id: user.id
    }).then(function () {
        done(null, code);
    }).catch(function (err) {
        return done(err);
    });
};