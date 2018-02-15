"use strict";

const config = require('../config');
const simplePassword = require('./password-quality');
const owasp = require('owasp-password-strength-test');

const CONFIG_DATA = config.password || {};
const PASSWORD_QUALITY_CHECK = (CONFIG_DATA.quality_check || '').toLowerCase();
const DEFAULT_QUALITY = 'owasp';

const qualities = {};

registerQuality(
    'no',
    {
        isStrong: (mail, password) => {
            return true;
        },
        getQuality: (mail, password) => {
            return 1;
        },
        getWeaknessesMsg: (mail, password, req) => {
            return '';
        },
        getWeaknesses: (mail, password, req) => {
            return [];
        }
    }
);

registerQuality(
    'owasp',
    {
        isStrong: (mail, password) => {
            let owaspResult = owasp.test(password);
            return (owaspResult.strong && passCustomCheck(mail, password));
        },
        getQuality: (mail, password) => {
            let owaspResult = owasp.test(password);
            return (owaspResult.strong && passCustomCheck(mail, password));
        },
        getWeaknessesMsg: (mail, password, req) => {
            let owaspResult = owasp.test(password);

            let msg = req.__('BACK_SIGNUP_PASS_STRENGTH') + "<br/>";
            for (let i = 0; i < owaspResult.failedTests.length; i++) {
                msg = msg + " - " + req.__('BACK_SIGNUP_PASS_STRENGTH_' + owaspResult.failedTests[i]) + "<br/>";
            }
            let check = customCheck(mail, password, req);
            for (let c = 0; c < check.length; c++) {
                msg = msg + " - " + check[c] + "<br/>";
            }

            return msg;
        },
        getWeaknesses: (mail, password, req) => {
            let owaspResult = owasp.test(password);

            let toReturn = [];
            for (let i = 0; i < owaspResult.failedTests.length; i++) {
                toReturn.push(req.__('BACK_SIGNUP_PASS_STRENGTH_' + owaspResult.failedTests[i]));
            }
            if (mail && mail.toUpperCase() === password.toUpperCase()) {
                toReturn.push(req.__('BACK_SIGNUP_PASS_STRENGTH_EMAIL_EQUALS_PASSWORD'));
            }
            return toReturn;
        }
    }
);

registerQuality(
    'simple',
    {
        isStrong: (mail, password) => {
            let result = simplePassword.getQuality(password).value > 0;
            return result && passCustomCheck(mail, password);
        },
        getQuality: (mail, password) => {
            if (!passCustomCheck(mail, password)) {
                return 0;
            }
            let result = simplePassword.getQuality(password);
            return result.value;
        },
        getWeaknessesMsg: (mail, password, req) => {
            let message = req.__('BACK_SIGNUP_PASS_STRENGTH');
            let check = customCheck(mail, password, req);
            for (let c = 0; c < check.length; c++) {
                message = message + " - " + check[c] + "<br/>";
            }

            let result = simplePassword.getQuality(password);
            if (result > 0) {
                return message;
            }
            message += ' - ' + simplePassword.getMessage(result.error, req) + '<br/>';
            return message;
        },
        getWeaknesses: (mail, password, req) => {
            let message = [];

            let check = customCheck(mail, password, req);
            for (let c = 0; c < check.length; c++) {
                message.push(check[c]);
            }

            let result = simplePassword.getQuality(password);
            if (result > 0) {
                return message;
            }

            message.push(simplePassword.getMessage(result.error, req));
            return message;
        }
    }
);


function isStrong(mail, password) {
    return qualities[PASSWORD_QUALITY_CHECK || DEFAULT_QUALITY].isStrong(mail, password);
}

function getQuality(mail, password) {
    return qualities[PASSWORD_QUALITY_CHECK || DEFAULT_QUALITY].getQuality(mail, password);
}

function getWeaknessesMsg(mail, password, req) {
    return qualities[PASSWORD_QUALITY_CHECK || DEFAULT_QUALITY].getWeaknessesMsg(mail, password, req);
}

function getWeaknesses(mail, password, req) {
    return qualities[PASSWORD_QUALITY_CHECK || DEFAULT_QUALITY].getWeaknesses(mail, password, req);
}

function customCheck(mail, password, req) {
    var toReturn = [];
    if (!mail) {
        return toReturn;
    }
    if (mail.toUpperCase() === password.toUpperCase()) {
        toReturn.push(req.__('BACK_SIGNUP_PASS_STRENGTH_EMAIL_EQUALS_PASSWORD'));
    }
    return toReturn;
}

function passCustomCheck(mail, password, req) {
    if (!mail) {
        return true;
    }
    return (mail.toUpperCase() !== password.toUpperCase());
}

module.exports = {
    isStrong: isStrong,
    getQuality,
    getWeaknessesMsg: getWeaknessesMsg,
    getWeaknesses: getWeaknesses,
};

function registerQuality(name, functions) {
    qualities[name] = functions;
}
