"use strict";

var db            = require('../../models');
var config        = require('../../config');
var requestHelper = require('../../lib/request-helper');

var bcrypt        = require('bcrypt');
var passport      = require('passport');
var Q             = require('q');

var jwt              = require('jwt-simple');
var JwtStrategy      = require('passport-jwt').Strategy;

var FacebookStrategy = require('passport-facebook').Strategy;



function verifyFacebookUserAccessToken(token) {
    var deferred = Q.defer();
    var path = 'https://graph.facebook.com/me?access_token=' + token;
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
            var photo_url = (data.photos.length > 0) ? data.photos[0].value : null;
            var user = {
                provider_uid: data.id,
                display_name: data.name,
                photo_url: photo_url
            };
            deferred.resolve(user);
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
            deferred.reject({code: response.statusCode, message: data.error.message});
        }
    });
    return deferred.promise;
}

function performFacebookLogin(appName, profile, fbAccessToken) {
    var deferred = Q.defer();
    var photo_url = (data.photos.length > 0) ? data.photos[0].value : null;
    if (appName && profile && fbAccessToken) {
        db.User.findOrCreate({provider_uid: profile.id, display_name: profile.displayName, photo_url: photo_url }).success(function(user){
            if (user.hasChanged(profile.displayName, photo_url)){
                user.updateAttributes({
                   display_name: profile.displayName,
                   photo_url: photo_url
                }).success(function(){
                    var token = jwt.encode(user, config.jwtSecret);
                    var response = {
                      success: true,
                      user: user,
                      token: 'JWT ' + token
                    };
                    deferred.resolve(response);
                }).error(function(error){
                    deferred.reject(error);
                });
            }
        }).error(function(err) {
           deferred.reject(err);
        });
    }
    return deferred.promise;
}

module.exports = function(app, options) {
    app.post('api/facebook/signup', function(req, res) {
        var facebookAccessToken = req.body.fbToken;
        var applicationName = req.body.appName;
        if (facebookAccessToken && facebookAccessToken.length > 0 && applicationName && applicationName.length > 0) {
            // Get back user object from Facebook
            verifyFacebookUserAccessToken(facebookAccessToken).
            then(function(user) {
                    // Invoke wrapper function performLogin and return on deferred resolved
                    performFacebookLogin(applicationName, user, facebookAccessToken).
                    then(function(loginViewModel) {
                        // Return the login view model to the client
                        logger.log('info', 'User ' + loginViewModel.userId + ' successfully logged in using application' +
                            ' ' + applicationName + ' from: ' + req.connection.remoteAddress + '.');
                        res.json(200, loginViewModel);
                    });
                }, function(error) {
                    logger.log('error', 'Login unsuccessful: ' + error.message +
                        ' . Request from address ' + req.connection.remoteAddress + ' .');
                    res.json(401, {
                        error: error.message
                    });
                }
            ).fail(function(error){
                logger.log('error', 'An error has occurred while attempting to login mobile user using Facebook OAuth' +
                    ' from address ' + req.connection.remoteAddress + '. Stack trace: ' + error.stack);
                res.json(500, {
                    error: error.message
                });
            });
        }
        else {
            // 400 BAD REQUEST
            logger.log('error', 'Bad login request from ' +
                req.connection.remoteAddress + '. Reason: facebook access token and application name are required.');
            res.json(400);
        }
    });
};


