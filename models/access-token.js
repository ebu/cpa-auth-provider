"use strict";

module.exports = function(sequelize, DataTypes) {

  var AccessToken = sequelize.define('AccessToken', {
    token: { type: DataTypes.STRING, primaryKey: true }
  }, {
    underscored: true,

    associate: function(models) {
      AccessToken.belongsTo(models.Client);
      AccessToken.belongsTo(models.Domain);
      AccessToken.belongsTo(models.User);
    }
  });

  return AccessToken;
};
