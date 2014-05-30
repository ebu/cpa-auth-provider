"use strict";

module.exports = function(sequelize, DataTypes) {
  var Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    secret: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
    name: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
    software_id: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
    software_version: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
    ip: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        isIP: true
      }
    },
    registration_type: {
      type: DataTypes.ENUM,
      values: ['dynamic', 'static'],
      defaultValue: 'dynamic',
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
    redirect_uri: { //TODO: Move to its own table
      type: DataTypes.STRING
    }
  }, {
    underscored: true,

    associate: function(models) {
      Client.hasMany(models.PairingCode);
      Client.hasMany(models.AccessToken);
      Client.belongsTo(models.User);
    }
  });

  return Client;
};
