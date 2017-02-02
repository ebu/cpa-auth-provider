"use strict";

var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt'));
var config = require('../config');


module.exports = function (sequelize, DataTypes) {

    var User = sequelize.define('User', {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        tracking_uid: DataTypes.STRING,
        provider_uid: DataTypes.STRING,
        email: DataTypes.STRING,
        password: DataTypes.STRING,
        enable_sso: DataTypes.BOOLEAN,
        display_name: DataTypes.STRING,
        photo_url: DataTypes.STRING,
        verified: DataTypes.BOOLEAN,
        admin: DataTypes.BOOLEAN   // maybe replace that by an array of roles
    }, {
        underscored: true,
        instanceMethods: {

            setPassword: function (password) {
                var self = this;
                return new Promise(
                    function (resolve, reject) {
                        bcrypt.hash(
                            password,
                            10,
                            function (err, hash) {
                                if (err) {
                                    return reject(err);
                                } else {
                                    return self.updateAttributes({password: hash}).then(resolve, reject);
                                }
                            }
                        );
                    }
                );
            },
            verifyPassword: function (password) {
                return bcrypt.compareAsync(password, this.password);
            },
            hasChanged: function (displayName, photoUrl) {
                return (this.display_name !== displayName || this.photo_url !== photoUrl);
            }
        },
        associate: function (models) {
            User.hasMany(models.Client);
            User.hasMany(models.AccessToken);
            User.hasMany(models.ValidationCode);
            User.belongsTo(models.IdentityProvider);
            User.hasOne(models.UserProfile);
        }
    });

    return User;
};