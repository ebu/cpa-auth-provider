"use strict";

module.exports = function(sequelize, DataTypes) {



  var ServiceAccessToken = sequelize.define('ServiceAccessToken', {
    token: { type: DataTypes.STRING, primaryKey: true }
  }, {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    associate: function(models) {
      ServiceAccessToken.belongsTo(models.Client);
      ServiceAccessToken.belongsTo(models.ServiceProvider);
      ServiceAccessToken.belongsTo(models.User);
    }
  });

  return ServiceAccessToken;

};
