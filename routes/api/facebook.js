"use strict";

var db = require('../../models');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');
var jwtHelper = require('../../lib/jwt-helper');
var request = require('request');
var jwt = require('jwt-simple');
var cors = require('../../lib/cors');


function verifyFacebookUserAccessToken(token, done) {
    var path = 'https://graph.facebook.com/me?fields=id,name,email&access_token=' + token;
    request(path, function (error, response, body) {
        var data = JSON.parse(body);
        if (!error && response && response.statusCode && response.statusCode === 200) {
            var user = {
                provider_uid: "fb:" + data.id,
                display_name: data.name,
                email: data.email
            };
            done(null, user);
        }
        else {
            console.log(data.error);
            done({code: response.statusCode, message: data.error.message}, null);
        }
    });
}

function buildResponse(user) {
    var token = jwtHelper.generate(user.id, 10 * 60 * 60);
    return {
        success: true,
        user: user,
        token: token
    };
}

function performFacebookLogin(appName, profile, fbAccessToken, done) {

    if (appName && profile && fbAccessToken) {

        db.User.findOne({ where: {provider_uid: profile.provider_uid} }).then( function(me){
            if(me) {
                me.logLogin().then(function (user) {
                    return done(null, buildResponse(user));
                }, function (error) {
                    return done(error, null);
                });
            } else {
                db.User.findOrCreate({
                    where: {
                        provider_uid: profile.provider_uid,
                        display_name: profile.name,
                        email: profile.email
                    }
                }).spread(function (me) {
                    console.log("USER", me);
                    me.logLogin().then(function (user) {
                        return done(null, buildResponse(user));
                    }, function (error) {
                        return done(error, null);
                    });
                }).catch(function (err) {
                    return done(err, null);
                });
            }

        }, function (error){
            return done(error, null);
        });
    }
}

module.exports = function (app, options) {
    app.post('/api/facebook/signup', cors, function (req, res) {
        var facebookAccessToken = req.body.fbToken;
        var applicationName = req.body.appName;
        if (facebookAccessToken && facebookAccessToken.length > 0 && applicationName && applicationName.length > 0) {
            // Get back user object from Facebook
            verifyFacebookUserAccessToken(facebookAccessToken, function (err, user) {
                if (user) {
                    performFacebookLogin(applicationName, user, facebookAccessToken, function (error, response) {
                        if (response) {
                            res.status(200).json(response);
                        } else {
                            console.log(error);
                            res.status(500).json({error: error.message});
                        }
                    });
                } else {
                    console.log(err);
                    res.status(500).json({error: err.message});
                }

            });
        }
        else {
            // 400 BAD REQUEST
            console.log('error', 'Bad login request from ' +
                req.connection.remoteAddress + '. Reason: facebook access token and application name are required.');
            res.status(400);
        }
    });
};


