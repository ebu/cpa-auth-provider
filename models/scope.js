"use strict";

module.exports = function(sequelize, DataTypes) {

  var Scope = sequelize.define('Scope', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING
    },
    display_name: {
      type: DataTypes.STRING
    },
    access_token: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
  }, {
    underscored: true,

    associate: function(models) {
      Scope.hasMany(models.PairingCode);
      Scope.hasMany(models.AccessToken);
    }
  });

  return Scope;
};
