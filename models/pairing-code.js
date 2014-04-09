"use strict";

var config = require('../config');

module.exports = function(sequelize, DataTypes) {

  var PairingCode = sequelize.define('PairingCode', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    device_code: DataTypes.STRING,
    user_code: DataTypes.STRING,
    verification_uri: DataTypes.STRING,
    verified: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    underscored: true,

    instanceMethods: {

      /**
       * Returns the duration, in seconds, before this pairing code
       * expires.
       */

      getTimeToLive: function() {
        var now = new Date();
        var duration = (now - this.created_at) / 1000.0;
        var timeToLive = config.valid_pairing_code_duration - duration;

        return timeToLive;
      },

      /**
       * Returns true if this pairing code has expired, or false otherwise.
       */

      hasExpired: function() {
        return this.getTimeToLive() <= 0.0;
      }
    },

    associate: function(models) {
      PairingCode.belongsTo(models.Client);
      PairingCode.belongsTo(models.User);
      PairingCode.belongsTo(models.Scope);
    }
  });

  PairingCode.scopeValues = PairingCode;

  return PairingCode;
};
