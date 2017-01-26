"use strict";

var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt'));
var generate = require('../lib/generate');

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
        verificationCode: DataTypes.STRING,
        passwordRecoveryCode: DataTypes.STRING,
        passwordRecoveryCodeDate:DataTypes.DATE,
        admin: DataTypes.BOOLEAN   // maybe replace that by an array of roles
    }, {
        underscored: true,
        instanceMethods: {
            generateRecoveryCode: function () {
                // Generate a recovery code only if the TTL is too short
                if (! this.passwordRecoveryCode || Date.now().getTime() + config.password.keep_recovery_code_until + this.passwordRecoveryCodeDate.getTime()){
                    var verificationCode = generate.cryptoCode(30)
                    this.updateAttributes({passwordRecoveryCode: verificationCode});
                    this.updateAttributes({passwordRecoveryCodeDate: Date.now()});
                }
            },
            recoverPassword: function (code, newPass) {
                // Check if passwordRecoveryCode is defined
                if (this.passwordRecoveryCode && this.code === this.passwordRecoveryCode && this.passwordRecoveryCodeDate.getTime() + config.password.recovery_code_validity_duration < Date.now().getTime()){
                    this.updateAttributes({passwordRecoveryCode: newPass});
                    return true;
                } else {
                    return false;
                }
            },
            genereateVerificationCode: function () {
                var verificationCode = generate.cryptoCode(30)
                this.updateAttributes({verificationCode: verificationCode});
                this.updateAttributes({verified: false});
            },
            verifyAccount: function(sendedVerificationCode){
                if (sendedVerificationCode === this.verificationCode){
                    this.updateAttributes({verified: true});
                }
            },
            setPassword: function (password) {
                var self = this;
                return bcrypt.genSaltAsync(10).then(function (salt) {
                        return bcrypt.hashAsync(password, salt);
                    })
                    .then(function (encrypted, salt) {
                        return self.updateAttributes({password: encrypted});
                    });
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
            User.belongsTo(models.IdentityProvider);
            User.hasOne(models.UserProfile);
        }
    });

    return User;
};