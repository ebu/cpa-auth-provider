"use strict";

var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt'));
var generate = require('../lib/generate');
var config = require('../config');
var db = require('../models');


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
        passwordRecoveryCodeDate: DataTypes.INTEGER,
        admin: DataTypes.BOOLEAN   // maybe replace that by an array of roles
    }, {
        underscored: true,
        instanceMethods: {
            generateRecoveryCode: function () {
                // Generate a recovery code only if the TTL is too short
                if (!this.passwordRecoveryCode || Date.now() + config.password.keep_recovery_code_until + this.passwordRecoveryCodeDate) {
                    var verificationCode = generate.cryptoCode(30);
                    this.updateAttributes({passwordRecoveryCode: verificationCode});
                    this.updateAttributes({passwordRecoveryCodeDate: Date.now()});
                }
            },
            recoverPassword: function (code, newPass) {
                // Check if passwordRecoveryCode is defined
                if (this.passwordRecoveryCode && code === this.passwordRecoveryCode && this.passwordRecoveryCodeDate + config.password.recovery_code_validity_duration * 1000 > Date.now()) {

                    this.passwordRecoveryCode = null;
                    this.save();

                    this.updateAttributes({passwordRecoveryCodeDate: 0});

                    this.setPassword(newPass);

                    return true;

                } else {
                    return false;
                }
            },
            //recoverPassword: function (code, newPass) {
            //    // Check if passwordRecoveryCode is defined
            //    if (this.passwordRecoveryCode && code === this.passwordRecoveryCode && this.passwordRecoveryCodeDate + config.password.recovery_code_validity_duration * 1000 > Date.now()) {
            //
            //        var self = this;
            //
            //        console.log("id:", self.id);
            //
            //        return sequelize.transaction({autocommit: false}, function (t) {
            //            return User.findOne({where:{id: self.id}}, t).then(function (user) {
            //                console.log("user", user);
            //                console.log("t", t);
            //                user.passwordRecoveryCode = null;
            //                user.save({transaction: t});
            //                return user;
            //            }).then(function (user) {
            //                user.updateAttributes({passwordRecoveryCodeDate: 0}, {transaction: t});
            //                return user;
            //            }).then(function (user) {
            //                var hash = user.hashPassword(newPass);
            //                user.updateAttributes({password: hash}, {transaction: t});
            //                return user;
            //            }).then(function () {
            //                console.log("tx success");
            //                return t.commit();
            //            }).catch(function (err) {
            //                console.log("err", err);
            //                console.log("tx rollback");
            //                return t.rollback();
            //            });
            //        });
            //    } else {
            //        return false;
            //    }
            //},
            genereateVerificationCode: function () {
                var verificationCode = generate.cryptoCode(30);
                this.updateAttributes({verificationCode: verificationCode});
                this.updateAttributes({verified: false});
                return true;
            },
            verifyAccount: function (sendedVerificationCode) {
                if (sendedVerificationCode === this.verificationCode) {
                    this.updateAttributes({verified: true});
                    return true;
                }
                return false;
            },
            hashPassword: function (password) {
                var salt = bcrypt.genSaltSync(10);
                var hash = bcrypt.hashSync(password, salt);
                return hash;
            },
            setPassword: function (password) {
                var hash = this.hashPassword(password);
                this.updateAttributes({password: hash});
                return true;
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