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
    FB: FB,
    GOOGLE: GOOGLE
};

function performLogin(profile, providerName, done) {
        db.OAuthProvider.findOne({where: {uid: profile.provider_uid}}).then(function (provider) {
            if (!provider) {
                db.User.findOrCreate({
                    where: {
                        email: profile.email
                    }, defaults: {
                        verified: true,
                        display_name: profile.display_name
                    }
                }).spread(function (me) {
                    me.updateAttributes({display_name: profile.display_name, verified: true}).then(function () {
                        me.logLogin().then(function (user) {
                            var provider = db.OAuthProvider.build({
                                where: {
                                    name: providerName,
                                    uid: profile.provider_uid,
                                    user_id: user.id
                                }
                            });
                            provider.save().then(function () {
                                return done(null, buildResponse(user));
                            });
                        }, function (error) {
                            return done(error, null);
                        });
                    });
                }).catch(function (err) {
                    return done(err, null);
                });
            } else {
                db.User.findOne({where: {email: profile.email}}).then(function (user) {
                    user.logLogin().then(function () {
                        return done(null, buildResponse(user));
                    }, function (error) {
                        return done(error, null);
                    });
                });
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

function findOrCreateExternalUser(email, provider_uid, displayName, providerName) {
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
                                    resolve(user);
                                });
                            } else {
                                resolve(user);
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
                                resolve(user);
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


