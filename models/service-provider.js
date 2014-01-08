"use strict";



module.exports = function(sequelize, DataTypes) {

  var ServiceProvider = sequelize.define('ServiceProvider', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING
  }, {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    associate: function(models) {
      ServiceProvider.hasMany(models.PairingCode);
      ServiceProvider.hasMany(models.ServiceAccessToken);
    }
  });

  return ServiceProvider;

};
