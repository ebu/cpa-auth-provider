"use strict";

module.exports = function(sequelize, DataTypes) {

  var Domain = sequelize.define('Domain', {
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
      Domain.hasMany(models.PairingCode);
      Domain.hasMany(models.AccessToken);
    }
  });

  return Domain;
};
