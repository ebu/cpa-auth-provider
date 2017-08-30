"use strict";

var config = require('../config');
var expiresMixin = require('../lib/expires-mixin');

module.exports = function (sequelize, DataTypes) {

    var AccessToken = sequelize.define('AccessToken', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        token: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: true
            }
        }
    }, {
        underscored: true,
        associate: function (models) {
            AccessToken.belongsTo(models.Client);
            AccessToken.belongsTo(models.Domain);
            AccessToken.belongsTo(models.User);
        }
    });

    var funcs = expiresMixin(config.access_token_lifetime);
    for (var f in funcs) {
        if (funcs.hasOwnProperty(f) && typeof funcs[f] === 'function') {
            AccessToken.prototype[f] = funcs[f];
        }
    }

    return AccessToken;
};
