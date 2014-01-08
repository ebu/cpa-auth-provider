"use strict";



module.exports = function(sequelize, DataTypes) {

  var Client = sequelize.define('Client', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    secret: DataTypes.STRING,
    //redirect_uris: DataTypes.STRING,
    name: DataTypes.STRING,

    //logo_uri
    //contacts
    //tos_uri
    //policy_uri
    //token_endpoint_auth_method
    //scope
    //grant_types
    //response_types
    //jwks_uri

    software_id: DataTypes.STRING,
    software_version: DataTypes.STRING,
    ip: DataTypes.STRING

  }, {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    associate: function(models) {
      Client.hasMany(models.RegistrationAccessToken);
      Client.hasMany(models.PairingCode);
    }
  });

  return Client;

};
