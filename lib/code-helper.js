"use strict";

var db = require('../models');
var generate = require('../lib/generate');
var config = require('../config');

module.exports = {

    generatePasswordRecoveryCode: function (userId) {

        return db.ValidationCode.findOne({
            limit: 1,
            where: {
                user_id: userId,
                type: 'account'
            }
        }).then(function (validationCode) {
            // Generate a recovery code only if the TTL is too short
            if (validationCode) {
                // Push TTL
                return validationCode.updateAttributes({passwordRecoveryCodeDate: Date.now()}).then(function () {
                    return validationCode.value;
                });
            } else {
                var verificationCode = generate.cryptoCode(30);
                return db.ValidationCode.create({
                    date: Date.now(),
                    value: verificationCode,
                    user_id: userId,
                    type: 'account'
                }).then(function () {
                    return verificationCode;
                });
            }
        });


    },
    recoverPassword: function (user, code, newPass) {
        return db.ValidationCode.findOne({
            where: {
                user_id: user.id,
                type: 'account',
                value: code
            }
        }).then(function (validationCode) {
            if (validationCode) {
                if (validationCode.date + config.password.recovery_code_validity_duration * 1000 >= Date.now()) {
                    return db.LocalLogin.findOne({where: {user_id: user.id}}).then(function (localLogin) {
                        return (localLogin.setPassword(newPass)).then(function () {
                            return db.ValidationCode.destroy({
                                where: {
                                    user_id: user.id,
                                    type: 'account'
                                }
                            }).then(function () {
                                return true;
                            });
                        });
                    });
                } else {
                    return validationCode.destroy().then(function () {
                        return false;
                    });
                }
            } else {
                return false;
            }
        });

    },
    getOrGenereateEmailVerificationCode: function (user, transaction) {

        return db.ValidationCode.findOne({
            where: {
                user_id: user.id,
                type: 'email'
            }
        }).then(function (validationCode) {
            if (validationCode) {
                return validationCode.value;
            } else {
                var verificationCode = generate.cryptoCode(30);
                return db.ValidationCode.create({
                    date: Date.now(),
                    user_id: user.id,
                    value: verificationCode,
                    type: 'email'
                }, {transaction: transaction}).then(function (verificationCode) {
                    return verificationCode.value;
                });
            }
        });


    },
    verifyEmail: function (localLogin, sentVerificationCode) {

        return db.ValidationCode.findOne({
            where: {
                user_id: localLogin.user_id,
                type: 'email',
                value: sentVerificationCode
            }
        }).then(function (validationCode) {
            if (validationCode) {
                return localLogin.updateAttributes({verified: true}).then(function () {
                    return true;
                });
            } else {
                return false;
            }
        });

    }


};

