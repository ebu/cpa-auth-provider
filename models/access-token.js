"use strict";

var config       = require('../config');
var expiresMixin = require('../lib/expires-mixin');

module.exports = function(sequelize, DataTypes) {

  var AccessToken = sequelize.define('AccessToken', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    token: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    }
  }, {
    underscored: true,

    instanceMethods: expiresMixin(config.access_token_lifetime),

    associate: function(models) {
      AccessToken.belongsTo(models.Client);
      AccessToken.belongsTo(models.OAuth2Client);
      AccessToken.belongsTo(models.Domain);
      AccessToken.belongsTo(models.User);
    }
  });

  return AccessToken;
};
