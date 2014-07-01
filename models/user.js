"use strict";

module.exports = function(sequelize, DataTypes) {

  var User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    provider_uid: DataTypes.STRING,
    password: DataTypes.STRING,
    enable_sso: DataTypes.BOOLEAN,
    display_name: DataTypes.STRING,
    photo_url: DataTypes.STRING
  }, {
    underscored: true,

    associate: function(models) {
      User.hasMany(models.Client);
      User.hasMany(models.AccessToken);
      User.belongsTo(models.IdentityProvider);
    }
  });

  return User;
};
