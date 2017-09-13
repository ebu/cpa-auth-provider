"use strict";

var bcrypt = require('bcrypt');
var config = require('../config');
var legacyPasswordHelper = require('../lib/legacy-password-helper');

// mark password hashes as bcrypt password
var BCRYPT_TAG = '{BC}';
var PASSWORD_REGEX = /(\{\w+})?(.*)/;

module.exports = function (sequelize, DataTypes) {

    var User = sequelize.define('User', {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        tracking_uid: DataTypes.STRING,
        provider_uid: DataTypes.STRING,
        email: {type: DataTypes.STRING, unique: true},
        password: DataTypes.STRING,
        enable_sso: DataTypes.BOOLEAN,
        display_name: DataTypes.STRING,
        photo_url: DataTypes.STRING,
        verified: DataTypes.BOOLEAN,
        password_changed_at: DataTypes.BIGINT,
        last_login_at: DataTypes.BIGINT
    }, {
        underscored: true,

        associate: function (models) {
            User.hasMany(models.Client);
            User.hasMany(models.AccessToken);
            User.hasMany(models.ValidationCode);
            User.belongsTo(models.IdentityProvider);
            User.belongsTo(models.Permission);
            User.hasOne(models.UserProfile);
        }
    });

    User.prototype.logLogin = function (transaction) {
        var self = this;
        return self.updateAttributes({last_login_at: Date.now()}, {transaction: transaction});
    };
    User.prototype.setPassword = function (password) {
        var self = this;
        return new Promise(
            function (resolve, reject) {
                bcrypt.hash(password, 10).then(
                    function (hash) {
                        return self.updateAttributes(
                            {password: BCRYPT_TAG + hash, password_changed_at: Date.now()}
                        )
                    }
                ).then(
                    resolve
                ).catch(reject);
            }
        );
    };
    User.prototype.verifyPassword = function (password) {
        var result = PASSWORD_REGEX.exec(this.password);
        var hash = result[2];
        var func = legacyPasswordHelper.getCheckFunction(result[1]);
        if (func) {
            return func(password, hash);
        } else { // if (result[1] === BCRYPT_TAG || !result[1]) {
            return bcrypt.compare(password, hash);
        }
    };
    User.prototype.isFacebookUser = function () {
        var self = this;
        if (self.provider_uid && self.provider_uid.indexOf('fb:') !== -1) {
            return true;
        }
        return false;
    };

    User.prototype.isGoogleUser =  function () {
        var self = this;
        if(self.provider_uid && self.provider_uid.indexOf('google:') !== -1) {
            return true;
        }
        return false;
    };

    return User;
};