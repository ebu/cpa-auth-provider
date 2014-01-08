"use strict";

module.exports = function(sequelize, DataTypes) {

  var AccessTokenScope = ['RegistrationConfiguration'];

  var AccessToken = sequelize.define('AccessToken', {
    token: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    scope: {
      type:   DataTypes.ENUM,
      values: AccessTokenScope
    }
  }, {
    associate: function(models) {
      AccessToken.belongsTo(models.Client);
    }
  });


  AccessToken.scopeValues = AccessTokenScope;

  return AccessToken;

};