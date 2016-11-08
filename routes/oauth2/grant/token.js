"use strict";

var db = require('../../../models');
var generate = require('../../../lib/generate');
var jwtHelper = require('../../../lib/jwt-helper');

// Grant implicit authorization.  The callback takes the `client` requesting
// authorization, the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a token, which is bound to these
// values.

exports.token = function (client, user, ares, done) {
    var token = jwtHelper.generate(user.id, 10 * 60 * 60, { cli: client.id });
    return done(null, token);

    // var token = generate.accessToken();
	//
    // db.AccessToken.create({ token: token, user_id: user.id, oauth2_client_id: client.id })
    //     .then(function() {
    //         done(null, token);
    //     }).catch(function(err) {
    //         return done(err);
    //     });
};