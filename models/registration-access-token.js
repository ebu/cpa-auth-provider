"use strict";

module.exports = function(sequelize, DataTypes) {

  var RegistrationAccessToken = sequelize.define('RegistrationAccessToken', {
    token: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    scope: DataTypes.STRING
  }, {
    underscored: true,

    associate: function(models) {
      RegistrationAccessToken.belongsTo(models.Client);
    }
  });

  return RegistrationAccessToken;
};
