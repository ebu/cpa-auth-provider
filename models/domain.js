"use strict";

module.exports = function(sequelize, DataTypes) {

  var Domain = sequelize.define('Domain', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
    display_name: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    },

    // Access token used by the service provider when making requests to
    // /authorized
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
