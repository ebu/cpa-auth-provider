"use strict";

var db = require('../models');
var generate = require('../lib/generate');
var config = require('../config');

module.exports = {

    generatePasswordRecoveryCode: function (user) {

        return db.ValidationCode.findOne({
            where: {
                user_id: user.id,
                type: 'account',
                date: {lte: Date.now() + config.password.recovery_code_validity_duration}
            }
        }).then(function (validationCode) {
            // Generate a recovery code only if the TTL is too short
            if (validationCode) {
                console.log('validationCode:', validationCode);
                // Push TTL
                validationCode.updateAttributes({passwordRecoveryCodeDate: Date.now()});
                return validationCode.value;
            } else {
                var verificationCode = generate.cryptoCode(30);
                db.ValidationCode.create({
                    date: Date.now(),
                    value: verificationCode,
                    user_id: user.id,
                    type: 'account'
                });
                return verificationCode;
            }
        });


    },
    recoverPassword: function (user, code, newPass) {


        return db.ValidationCode.findOne({
            where: {
                user_id: user.id,
                type: 'account',
                date: {lte: Date.now() + config.password.recovery_code_validity_duration},
                value: code
            }
        }).then(function (validationCode) {

            if (validationCode) {
                user.setPassword(newPass);
                validationCode.destroy();
                return true;
            } else {
                return false;
            }

        });

    },
    getOrGenereateEmailVerificationCode: function (user, code) {

        return db.ValidationCode.findOne({
            where: {
                user_id: user.id,
                type: 'email',
                date: {lte: Date.now() + config.password.recovery_code_validity_duration},
                value: code
            }
        }).then(function (validationCode) {
            if (validationCode) {
                return validationCode.value;
            } else {
                var verificationCode = generate.cryptoCode(30)
                db.ValidationCode.create({
                    date: Date.now(),
                    user_id: user.id,
                    value: verificationCode,
                    type: 'email'
                });
                return verificationCode;
            }
        });


    },
    verifyEmail: function (user, sendedVerificationCode) {

        return db.ValidationCode.findOne({
            where: {
                user_id: user.id,
                type: 'email',
                value: sendedVerificationCode
            }
        }).then(function (validationCode) {
            if (validationCode) {
                return user.updateAttributes({verified: true}).then(function(){
                    return true;
                });
            } else {
                return false;
            }
        });

    }


}

