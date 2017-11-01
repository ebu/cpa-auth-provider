"use strict";

var config = require('../config');

var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth();
var client = new auth.OAuth2(config.identity_providers.google.client_id, '', '');
var logger = require('./logger');


function verifyGoogleIdToken(token) {
    return new Promise(function (resolve, reject) {
        client.verifyIdToken(token, config.identity_providers.google.client_id, function (e, login) {
            if (e) {
                logger.debug('unexpected error', e);
                return reject({message: 'unexpected error see logs'});
            }
            var payload = login.getPayload();
            var data = payload;

            if (data) {
                var user = {
                    provider_uid: "google:" + data.sub,
                    display_name: data.name,
                    email: data.email
                };
                return resolve(user);
            } else {
                return reject({message: 'No user with this google id were found'});
            }
        });
    });
}

module.exports = {
    verifyGoogleIdToken: verifyGoogleIdToken
};