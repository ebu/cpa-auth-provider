"use strict";

var db = require('../models');

var FB = 'facebook';
var GOOGLE = 'google';
module.exports = {
    isExternalOAuthUserOnly: isExternalOAuthUserOnly,
    getOAuthProviders: getOAuthProviders,
    FB: FB,
    GOOGLE: GOOGLE
};

function isExternalOAuthUserOnly(user) {
    db.OAuthProvider.count({where: {user_id: user.id}}).then(function (count) {
        return count >= 1;
    })
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
    })
}


