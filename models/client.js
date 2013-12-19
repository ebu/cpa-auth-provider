"use strict";

module.exports = function(sequelize, DataTypes) {

  var Client = sequelize.define('Client', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    secret: DataTypes.STRING,
    ip: DataTypes.STRING
  }, {
    updatedAt: 'last_update',
    createdAt: 'date_of_creation'
  });

  return Client;
}