"use strict";

module.exports = function(sequelize, DataTypes) {

  var PairingProcess = sequelize.define('PairingProcess', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    device_code: DataTypes.STRING,
    user_code: DataTypes.STRING,
    verification_uri: DataTypes.STRING,
    verified: DataTypes.BOOLEAN
  }, {

    associate: function(models) {
      PairingProcess.belongsTo(models.Client);
    }
  });


  PairingProcess.scopeValues = PairingProcess;

  return PairingProcess;

};
