"use strict";

var config       = require('../config');
var expiresMixin = require('../lib/expires-mixin');

module.exports = function(sequelize, DataTypes) {

  var PairingCode = sequelize.define('PairingCode', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    device_code: DataTypes.STRING,
    user_code: DataTypes.STRING,
    verification_uri: DataTypes.STRING,
    verified: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    underscored: true,

    instanceMethods: expiresMixin(config.pairing_code_lifetime),

    associate: function(models) {
      PairingCode.belongsTo(models.Client);
      PairingCode.belongsTo(models.User);
      PairingCode.belongsTo(models.Domain);
    }
  });

  return PairingCode;
};
