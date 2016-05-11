"use strict";

module.exports = function(sequelize, DataTypes) {
  var OAuth2Client = sequelize.define('OAuth2Client', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    client_id: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
    client_secret: {
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
    redirect_uri: { // TODO: Use its own table (RedirectURIWhiteList)
      type: DataTypes.STRING
    }
  }, {
    underscored: true,

    associate: function(models) {
      OAuth2Client.hasMany(models.OAuth2AuthorizationCode);
      OAuth2Client.hasMany(models.AccessToken);
      OAuth2Client.belongsTo(models.User);
    }
  });

  return OAuth2Client;
};
