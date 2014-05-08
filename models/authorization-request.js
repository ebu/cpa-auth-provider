"use strict";

var config = require('../config');

module.exports = function(sequelize, DataTypes) {

  var AuthorizationRequest = sequelize.define('AuthorizationRequest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    redirect_uri: DataTypes.STRING,
    state: DataTypes.STRING
  }, {
    underscored: true,

    instanceMethods: {

      /**
       * Returns the duration, in seconds, before this authorization request
       * expires.
       */

      getTimeToLive: function() {
        var now = new Date();
        var duration = (now - this.created_at) / 1000.0;
        var timeToLive = config.valid_authorization_request_duration - duration;

        return timeToLive;
      },

      /**
       * Returns true if this authorization request has expired, or false otherwise.
       */

      hasExpired: function() {
        return this.getTimeToLive() <= 0.0;
      }
    },

    associate: function(models) {
      AuthorizationRequest.belongsTo(models.Client);
      AuthorizationRequest.belongsTo(models.Scope);
    }
  });

  AuthorizationRequest.scopeValues = AuthorizationRequest;

  return AuthorizationRequest;
};
