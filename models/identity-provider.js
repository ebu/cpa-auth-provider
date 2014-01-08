"use strict";



module.exports = function(sequelize, DataTypes) {

  var IdentityProvider = sequelize.define('IdentityProvider', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING
  }, {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    associate: function(models) {
      IdentityProvider.hasMany(models.User);
    }
  });

  return IdentityProvider;

};
