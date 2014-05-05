"use strict";

var config = require('../config');

module.exports = function(sequelize, DataTypes) {

  var AuthorizationCode = sequelize.define('AuthorizationCode', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    authorization_code: DataTypes.STRING,
    state: DataTypes.STRING
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
      AuthorizationCode.belongsTo(models.Client);
      AuthorizationCode.belongsTo(models.User);
      AuthorizationCode.belongsTo(models.Scope);
    }
  });

  return AuthorizationCode;
};
