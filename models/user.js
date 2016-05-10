"use strict";

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
      setPassword: function(password, done) {
        return bcrypt.genSalt(10, function(err, salt) {
          return bcrypt.hash(password, salt, function(error, encrypted) {
            this.password = encrypted;
            this.salt = salt;
            return done();
          });
        });
      },
      verifyPassword: function(password, done) {
        return bcrypt.compare(password, this.password, function(err, res) {
          return done(err, res);
        });
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