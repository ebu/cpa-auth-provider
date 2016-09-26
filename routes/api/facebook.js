"use strict";

var db            = require('../../models');
var config        = require('../../config');
var requestHelper = require('../../lib/request-helper');

var bcrypt        = require('bcrypt');
var passport      = require('passport');
var request          = require('request');
var jwt              = require('jwt-simple');

var JwtStrategy      = require('passport-jwt').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;



function verifyFacebookUserAccessToken(token, done) {
    var path = 'https://graph.facebook.com/me?fields=id,name,picture&access_token=' + token;
    request(path, function (error, response, body) {
        /* blob example
         {
         "id": "xxxxxx",
         "name": "Valerio Gheri",
         "first_name": "Valerio",
         "last_name": "Gheri",
         "link": "https://www.facebook.com/valerio.gheri",
         "username": "valerio.gheri",
         "gender": "male",
         "email": "valerio.gheri@gmail.com",
         "timezone": 2,
         "locale": "en_US",
         "verified": true,
         "updated_time": "2013-08-14T09:16:58+0000"
         }
         */
        var data = JSON.parse(body);
        if (!error && response && response.statusCode && response.statusCode == 200) {
            var photo_url = (data.picture) ? data.picture.data.url : null;
            var user = {
                provider_uid: data.id,
                display_name: data.name,
                photo_url: photo_url
            };
            done(null, user);
        }
        else {
            /*
             {
             "error": {
             "message": "Error validating access token: Session has expired at unix time 1378054800. The current unix time is 1378489482.",
             "type": "OAuthException",
             "code": 190,
             "error_subcode": 463
             }
             }
             */
            console.log(data.error);
            //console.log(response);
            done({code: response.statusCode, message: data.error.message}, null);
        }
    });
}

function buildResponse(user) {
    var token = jwt.encode(user, config.jwtSecret);
    var response = {
        success: true,
        user: user,
        token: 'JWT ' + token
    };
    return response;
}

function performFacebookLogin(appName, profile, fbAccessToken, done) {

    if (appName && profile && fbAccessToken) {
        db.User.findOrCreate({provider_uid: profile.provider_uid, display_name: profile.display_name, photo_url: profile.photo_url }).success(function(user){
            if (user.hasChanged(profile.display_name, profile.photo_url)){
                user.updateAttributes({
                   display_name: profile.display_name,
                   photo_url: profile.photo_url
                }).success(function(){
                    return done(null, buildResponse(user));
                }).error(function(error){
                    return done(error, null);
                });
            } else {
                return done(null, buildResponse(user));
            }
        }).error(function(err) {
           return done(err, null);
        });
    }
}

module.exports = function(app, options) {
    app.post('/api/facebook/signup', function(req, res) {
        var facebookAccessToken = req.body.fbToken;
        var applicationName = req.body.appName;
        if (facebookAccessToken && facebookAccessToken.length > 0 && applicationName && applicationName.length > 0) {
            // Get back user object from Facebook
            verifyFacebookUserAccessToken(facebookAccessToken, function(err, user){
                if(user){
                    performFacebookLogin(applicationName, user, facebookAccessToken, function(error, response){
                        if(response){
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


