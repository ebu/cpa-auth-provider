"use strict";

module.exports = function(sequelize, DataTypes) {

  var PairingCode = sequelize.define('PairingCode', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    device_code: DataTypes.STRING,
    user_code: DataTypes.STRING,
    verification_uri: DataTypes.STRING,
    verified: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    associate: function(models) {
      PairingCode.belongsTo(models.Client);
      PairingCode.belongsTo(models.User);
      PairingCode.belongsTo(models.ServiceProvider);
    }
  });


  PairingCode.scopeValues = PairingCode;

  return PairingCode;

};
