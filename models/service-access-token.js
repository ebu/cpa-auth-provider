"use strict";

module.exports = function(sequelize, DataTypes) {

  var ServiceAccessToken = sequelize.define('ServiceAccessToken', {
    token: { type: DataTypes.STRING, primaryKey: true }
  }, {
    underscored: true,

    associate: function(models) {
      ServiceAccessToken.belongsTo(models.Client);
      ServiceAccessToken.belongsTo(models.Scope);
      ServiceAccessToken.belongsTo(models.User);
    }
  });

  return ServiceAccessToken;
};
