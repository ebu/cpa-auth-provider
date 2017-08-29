"use strict";

var config = require('../config');
var expiresMixin = require('../lib/expires-mixin');

module.exports = function (sequelize, DataTypes) {

    var PairingCode = sequelize.define('PairingCode', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        device_code: {
            type: DataTypes.STRING
        },
        user_code: {
            type: DataTypes.STRING
        },
        verification_uri: {
            type: DataTypes.STRING
        },
        state: {
            type: DataTypes.ENUM,
            values: ['pending', 'verified', 'denied'],
            defaultValue: 'pending',
            validate: {
                notEmpty: true
            }
        }
    }, {
        underscored: true,
        associate: function (models) {
            PairingCode.belongsTo(models.Client);
            PairingCode.belongsTo(models.User);
            PairingCode.belongsTo(models.Domain);
        }
    });

    var funcs = expiresMixin(config.pairing_code_lifetime);
    for (var f in funcs) {
        if (funcs.hasOwnProperty(f) && typeof funcs[f] === 'function') {
            PairingCode.prototype[f] = funcs[f];
        }
    }

    return PairingCode;
};
