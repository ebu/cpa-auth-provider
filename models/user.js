"use strict";



module.exports = function(sequelize, DataTypes) {

  var User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    provider_uid: DataTypes.STRING,
    enable_sso: DataTypes.BOOLEAN
  }, {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    associate: function(models) {
      User.hasMany(models.ServiceAccessToken);
      User.belongsTo(models.IdentityProvider);
    }
  });

  return User;

};
