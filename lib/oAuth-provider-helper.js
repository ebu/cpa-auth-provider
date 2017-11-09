"use strict";

var db = require('../models');
var jwtHelper = require('../lib/jwt-helper');

var FB = 'facebook';
var GOOGLE = 'google';
module.exports = {
    performLogin: performLogin,
    isExternalOAuthUserOnly: isExternalOAuthUserOnly,
    getOAuthProviders: getOAuthProviders,
    findOrCreateExternalUser: findOrCreateExternalUser,
    buildRemoteProfile:buildRemoteProfile,
    FB: FB,
    GOOGLE: GOOGLE
};

function performLogin(profile, providerName, done) {
    db.OAuthProvider.findOne({where: {uid: profile.provider_uid}}).then(function (provider) {
        var me, user;
        if (!provider) {
            db.User.findOrCreate({
                where: {
                    email: profile.email
                }, defaults: {
                    verified: true,
                    display_name: profile.display_name
                }
            }).spread(function (_me) {
                me = _me;
                return udpateOrCreateProfile(me, profile.first_name, profile.last_name, profile.gender, profile.birthday);
            }).then(function () {
                return me.updateAttributes({display_name: profile.display_name, verified: true});
            }).then(function () {
                return me.logLogin();
            }).then(function (_user) {
                user = _user;
                var provider = db.OAuthProvider.build({
                    name: providerName,
                    uid: profile.provider_uid,
                    user_id: user.id
                });
                return provider.save();
            }).then(function () {
                return done(null, buildResponse(user));
            }).catch(function (err) {
                return done(err, null);
            });
        } else {
            db.User.findOrCreate({
                where: {email: profile.email}, defaults: {
                    verified: true,
                    display_name: profile.display_name
                }
            }).spread(function (_user) {
                user = _user;
                return user.logLogin();
            }).then(function () {
                return done(null, buildResponse(user));
            }).catch(
                done
            );
        }
    }, function (error) {
        return done(error, null);
    });
}

function isExternalOAuthUserOnly(user) {
    return db.OAuthProvider.count({where: {user_id: user.id}}).then(function (count) {
        return count >= 1;
    });
}

function getOAuthProviders(user) {
    return db.OAuthProvider.findAll({where: {user_id: user.id}}).then(function (providers) {
        var toReturn = [];
        if (providers) {
            for (var i = 0; i < providers.length; i++) {
                toReturn.push(providers[i].name);
            }
        }
        return toReturn;
    });
}

function udpateOrCreateProfile(user, firstname, lastname, gender, date_of_birth) {
    return db.UserProfile.find(
        {
            where: {
                user_id: user.id
            }
        }
    ).then(function (userProfile) {
        if (!userProfile) {
            userProfile = db.UserProfile.build(
                {
                    user_id: user.id,
                    firstname: firstname,
                    lastname: lastname,
                    gender: gender,
                    date_of_birth: date_of_birth
                });
        }
        if (!userProfile.firstname && firstname) {
            userProfile.firstname = firstname;
        }
        if (!userProfile.lastname && lastname) {
            userProfile.lastname = lastname;
        }
        if (!userProfile.gender && gender){
            userProfile.gender = gender;
        }
        if (!userProfile.date_of_birth && date_of_birth) {
            userProfile.date_of_birth = date_of_birth;
        }
        return userProfile.save();
    });

}

function findOrCreateExternalUser(providerName, email, provider_uid, displayName, firstname, lastname, gender, date_of_birth) {
    return new Promise(function (resolve, reject) {
        db.User.find(
            {
                where: {
                    email: email
                }
            }
        ).then(
            function (user) {
                if (user) {
                    // user must be verified
                    if (!user.verified) {
                        return resolve(false);
                    } else {
                        db.OAuthProvider.findOne({
                            where: {
                                name: providerName,
                                user_id: user.id
                            }
                        }).then(function (provider) {
                            if (!provider) {
                                provider = db.OAuthProvider.build({
                                    name: providerName,
                                    uid: provider_uid,
                                    user_id: user.id
                                });
                                provider.save().then(function () {
                                    udpateOrCreateProfile(user, firstname, lastname, gender, date_of_birth).then(function () {
                                        resolve(user);
                                    });
                                });
                            } else {
                                udpateOrCreateProfile(user, firstname, lastname, gender, date_of_birth).then(function () {
                                    resolve(user);
                                });
                            }
                        });
                    }
                } else {
                    return db.User.findOrCreate(
                        {
                            where: {
                                email: email
                            },
                            defaults: {
                                verified: true,
                                display_name: displayName
                            }
                        }
                    ).spread(
                        function (user) {
                            var provider = db.OAuthProvider.build({
                                name: providerName,
                                uid: provider_uid,
                                user_id: user.id
                            });
                            provider.save().then(function () {
                                udpateOrCreateProfile(user, firstname, lastname, gender, date_of_birth).then(function () {
                                    resolve(user);
                                });
                            });
                        }
                    ).catch(reject);
                }
            },
            reject
        );
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

function buildRemoteProfile(id, name, email, first_name, last_name, gender, birthday){
    return {
        provider_uid:  id,
        display_name: name,
        email: email,
        first_name: first_name,
        last_name: last_name,
        gender: gender,
        birthday: birthday
    };
}


