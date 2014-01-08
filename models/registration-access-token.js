"use strict";

module.exports = function(sequelize, DataTypes) {



  var RegistrationAccessToken = sequelize.define('RegistrationAccessToken', {
    token: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    scope: DataTypes.STRING
  }, {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    associate: function(models) {
      RegistrationAccessToken.belongsTo(models.Client);
    }
  });

  return RegistrationAccessToken;

};