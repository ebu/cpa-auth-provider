var config = require('../config');

var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth();
var client = new auth.OAuth2(config.identity_providers.google.client_id, '', '');
var logger = require('./logger');


function verifyGoogleIdToken(token, callback) {
    client.verifyIdToken(token, config.identity_providers.google.client_id, function (e, login) {
        if (e) {
            logger.log('unexpected error', e);
            console.log('unexpected error', e);
            throw {message: 'unexpected error see logs'};
        }
        var payload = login.getPayload();
        var data = payload;

        console.log("data", data);

        if (data) {
            var user = {
                provider_uid: "google:" + data.sub,
                display_name: data.name,
                email: data.email
            };
            console.log("return ", user);

            callback(user);
        } else {
            throw {message: 'No user with this google id were found'};
        }
    });
}

module.exports = {
    verifyGoogleIdToken: verifyGoogleIdToken


};