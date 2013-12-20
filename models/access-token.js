"use strict";

module.exports = function(sequelize, DataTypes) {

  var AccessTokenScope = ['RegistrationConfiguration'];

  var AccessToken = sequelize.define('AccessToken', {
    token: DataTypes.STRING,
    scope: {
      type:   DataTypes.ENUM,
      values: AccessTokenScope
    }
  }, {
    associate: function(models) {
      AccessToken.belongsTo(models.Client);
    }
  });

  return AccessToken;

}