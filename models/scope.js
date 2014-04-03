"use strict";

module.exports = function(sequelize, DataTypes) {

  var Scope = sequelize.define('Scope', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
  }, {
    underscored: true,

    associate: function(models) {
      Scope.hasMany(models.PairingCode);
      Scope.hasMany(models.ServiceAccessToken);
    }
  });

  return Scope;
};
