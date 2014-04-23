"use strict";

var config       = require('../config');
var expiresMixin = require('../lib/expires-mixin');

module.exports = function(sequelize, DataTypes) {

  var AuthorizationCode = sequelize.define('AuthorizationCode', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    authorization_code: DataTypes.STRING,
    redirect_uri: DataTypes.STRING,
    state: DataTypes.STRING
  }, {
    underscored: true,

    instanceMethods: expiresMixin(config.authorization_code_lifetime),

    associate: function(models) {
      AuthorizationCode.belongsTo(models.Client);
      AuthorizationCode.belongsTo(models.User);
      AuthorizationCode.belongsTo(models.Domain);
    }
  });

  return AuthorizationCode;
};
