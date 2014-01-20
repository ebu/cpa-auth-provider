"use strict";

module.exports = function(sequelize, DataTypes) {

  var ServiceProvider = sequelize.define('ServiceProvider', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING
  }, {
    underscored: true,

    associate: function(models) {
      ServiceProvider.hasMany(models.PairingCode);
      ServiceProvider.hasMany(models.ServiceAccessToken);
    }
  });

  return ServiceProvider;
};
