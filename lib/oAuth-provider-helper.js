"use strict";

var db = require('../models');

var FB = 'facebook';
var GOOGLE = 'google';
module.exports = {
    isExternalOAuthUserOnly: isExternalOAuthUserOnly,
    getOAuthProviders: getOAuthProviders,
    findOrCreateExternalUser:findOrCreateExternalUser,
    FB: FB,
    GOOGLE: GOOGLE
};

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
                //TODO udpate display name and other data from FB.
                if (user){
                    // user must be verified
                    if (!user.verified) {
                        return resolve(false); //TODO raise error
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
                                provider.save().then(function (){
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
                            provider.save().then(function (){
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


