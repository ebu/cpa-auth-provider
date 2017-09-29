var config = require('../config');

var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth();
var client = new auth.OAuth2(config.identity_providers.google.client_id, '', '');

function verifyGoogleIdToken(token) {
    client.verifyIdToken(token, config.identity_providers.google.client_id, function (e, login) {
        if (e) {
            console.log('unexpected error', e);
            throw {message: 'unexpected error' + e};
        }
        var payload = login.getPayload();
        var data = payload;

        if (data) {
            var user = {
                provider_uid: "google:" + data.sub,
                display_name: data.name,
                email: data.email
            };
            return user;
        }
        throw {message: 'No user with this google id were found'};
    });
}

module.exports = {
    verifyGoogleIdToken: verifyGoogleIdToken


};