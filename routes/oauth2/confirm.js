// check if a token is valid, from a different server

"use strict";

var db = require('../../models/index');
var passport = require('passport');
var jwtHelper = require('../../lib/jwt-helper');

module.exports = function (app, options) {
    app.post(
        '/oauth2/confirm',
        function (req, res) {
            // TODO limit confirmation calls to certain origin hosts
            var clientId = req.body.client_id;
            var token = req.body.token;

            if (!token) {
                res.status(400).json({success: false, msg: 'token-missing'});
                return;
            }

            getClient(clientId).then(
                function (client) {
                    try {
                        var data = jwtHelper.decode(token, client.jwt_code);
                        // slightly slower solution: could check database here
                        res.status(200).json({success: true, user_id: data.sub});
                    } catch (err) {
                        res.status(500).json({success: false, msg: err});
                    }
                },
                function (err) {
                    res.status(500).json({success: false, msg: err});
                }
            );
        }
    );
};

function getClient(clientId) {
    return new Promise(
        function (resolve, reject) {
            if (clientId) {
                db.OAuth2Client.find({where: {client_id: clientId}}).then(resolve, reject);
            } else {
                resolve();
            }
        }
    );
}

