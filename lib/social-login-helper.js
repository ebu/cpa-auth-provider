"use strict";

var db = require('../models');
var jwtHelper = require('../lib/jwt-helper');

var FB = 'facebook';
var GOOGLE = 'google';
module.exports = {
    performLogin: performLogin,
    hasSocialLogin: hasSocialLogin,
    hasLocalLogin: hasLocalLogin,
    getOAuthProviders: getOAuthProviders,
    findOrCreateExternalUser: findOrCreateExternalUser,
    buildRemoteProfile: buildRemoteProfile,
    FB: FB,
    GOOGLE: GOOGLE
};

function performLogin(profile, providerName, done) {
    db.SocialLogin.findOne({where: {uid: profile.provider_uid}}).then(function (socialLogin) {
        var user;
        if (!socialLogin) {
            db.User.findOrCreate({
                where: {
                    email: profile.email
                }, defaults: {
                    verified: true,
                    display_name: profile.display_name
                }
            }).spread(function (me) {
                fillProfile(me, profile.first_name, profile.last_name, profile.gender, profile.birthday);
                return me.updateAttributes({display_name: profile.display_name});
            }).then(function (_user) {
                user = _user;
                var socialLogin = db.SocialLogin.build({
                    name: providerName,
                    uid: profile.provider_uid,
                    user_id: user.id,
                    firstname: profile.first_name,
                    lastname: profile.last_name,
                    gender: profile.gender,
                    birthday: profile.birthday
                });
                return socialLogin.save();
            }).then(function (provider) {
                provider.logLogin();
            }).then(function () {
                return done(null, buildResponse(user));
            }).catch(function (err) {
                return done(err, null);
            });
        } else {
            socialLogin.updateAttributes({
                firstname: profile.first_name,
                lastname: profile.last_name,
                gender: profile.gender,
                birthday: profile.birthday,
            }).spread(function () {
                socialLogin.logLogin();
            }).then(function () {
                db.User.findOrCreate({
                    where: {email: profile.email}, defaults: {
                        verified: true,
                        display_name: profile.display_name
                    }
                });
            }).spread(function (_user) {
                return done(null, buildResponse(_user));
            }).catch(
                done
            );
        }
    }, function (error) {
        return done(error, null);
    });
}

function hasSocialLogin(user) {
    return db.SocialLogin.count({where: {user_id: user.id}}).then(function (count) {
        return count >= 1;
    });
}

function hasLocalLogin(user) {
    return db.LocalLogin.count({where: {user_id: user.id}}).then(function (count) {
        return count >= 1;
    });
}

function getOAuthProviders(user) {
    return db.SocialLogin.findAll({where: {user_id: user.id}}).then(function (providers) {
        var toReturn = [];
        if (providers) {
            for (var i = 0; i < providers.length; i++) {
                toReturn.push(providers[i].name);
            }
        }
        return toReturn;
    });
}

function fillProfile(user, firstname, lastname, gender, date_of_birth) {
    if (!user.firstname && firstname) {
        user.firstname = firstname;
    }
    if (!user.lastname && lastname) {
        user.lastname = lastname;
    }
    if (!user.gender && gender) {
        user.gender = gender;
    }
    if (!user.date_of_birth && date_of_birth) {
        user.date_of_birth = date_of_birth;
    }
    return user.save();
}

function findOrCreateExternalUser(providerName, email, provider_uid, displayName, firstname, lastname, gender, date_of_birth) {
    return new Promise(function (resolve, reject) {
        db.LocalLogin.findOne({where: {login: email}, include: [db.User]}).then(function (localLogin) {
                if (localLogin) {
                    if (localLogin.verified) {
                        db.SocialLogin.findOne({
                            where: {
                                name: providerName,
                                user_id: localLogin.user_id
                            }
                        }).then(function (provider) {
                            if (!provider) {
                                provider = db.SocialLogin.build({
                                    name: providerName,
                                    uid: provider_uid,
                                    user_id: localLogin.user_id,
                                    firstname: firstname,
                                    lastname: lastname,
                                    gender: gender,
                                    birthday: date_of_birth,
                                    social_network: providerName
                                });
                                provider.save().then(function () {
                                    fillProfile(localLogin.User, firstname, lastname, gender, date_of_birth).then(function () {
                                        resolve(localLogin.User);
                                    });
                                });
                            } else {
                                provider.updateAttributes({
                                    firstname: firstname,
                                    lastname: lastname,
                                    gender: gender,
                                    birthday: date_of_birth
                                }).then(function () {
                                    fillProfile(localLogin.User, firstname, lastname, gender, date_of_birth).then(function () {
                                        resolve(localLogin.User);
                                    });
                                });
                            }
                        });
                    } else {
                        return resolve(false);
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
                            var provider = db.SocialLogin.build({
                                name: providerName,
                                uid: provider_uid,
                                user_id: user.id,
                                firstname: firstname,
                                lastname: lastname,
                                gender: gender,
                                birthday: date_of_birth
                            });
                            provider.save().then(function () {
                                fillProfile(user, firstname, lastname, gender, date_of_birth).then(function () {
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

function buildRemoteProfile(id, name, email, first_name, last_name, gender, birthday) {
    return {
        provider_uid: id,
        display_name: name,
        email: email,
        first_name: first_name,
        last_name: last_name,
        gender: gender,
        birthday: birthday
    };
}


