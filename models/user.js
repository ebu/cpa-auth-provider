"use strict";

var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt'));

module.exports = function(sequelize, DataTypes) {

  var User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    provider_uid: DataTypes.STRING,
    password: DataTypes.STRING,
    enable_sso: DataTypes.BOOLEAN,
    display_name: DataTypes.STRING,
    photo_url: DataTypes.STRING,
    admin: DataTypes.BOOLEAN   // maybe replace that by an array of roles
  }, {
    underscored: true,
    instanceMethods: {
      setPassword: function(password) {
        var self = this;
        return bcrypt.genSaltAsync(10).then(function(salt) {
          return bcrypt.hashAsync(password, salt);
        })
        .then(function(encrypted, salt) {
          return self.updateAttributes({ password: encrypted });
        });
      },
      verifyPassword: function(password) {
        return bcrypt.compareAsync(password, this.password);
      }
    },
    associate: function(models) {
      User.hasMany(models.Client);
      User.hasMany(models.AccessToken);
      User.belongsTo(models.IdentityProvider);
    }
  });

  return User;
};