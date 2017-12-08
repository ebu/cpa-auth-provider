"use strict";

var owasp = require('owasp-password-strength-test');

function isStrong(mail, password) {
    var owaspResult = owasp.test(password);
    return (owaspResult.strong && passCustomCheck(mail, password));
}

function getWeaknessesMsg(mail, password, req) {
    var owaspResult = owasp.test(password);

    var msg = req.__('BACK_SIGNUP_PASS_STRENGTH') + "<br/>";
    for (var i = 0; i < owaspResult.failedTests.length; i++) {
        msg = msg + " - " + req.__('BACK_SIGNUP_PASS_STRENGTH_' + owaspResult.failedTests[i]) + "<br/>";
    }
    var check = customCheck(mail, password, req);
    for (var c = 0; c < check.length; c++) {
        msg = msg + " - " + check[c] + "<br/>";
    }

    return msg;
}

function getWeaknesses(mail, password, req) {
    var owaspResult = owasp.test(password);

    var toReturn = [];
    for (var i = 0; i < owaspResult.failedTests.length; i++) {
        toReturn.push(req.__('BACK_SIGNUP_PASS_STRENGTH_' + owaspResult.failedTests[i]));
    }
    if (mail.toUpperCase() === password.toUpperCase()){
        toReturn.push(req.__('BACK_SIGNUP_PASS_STRENGTH_EMAIL_EQUALS_PASSWORD'));
    }
    return toReturn;
}

function customCheck(mail, password, req) {
    var toReturn = [];
    if (mail.toUpperCase() === password.toUpperCase()) {
        toReturn.push(req.__('BACK_SIGNUP_PASS_STRENGTH_EMAIL_EQUALS_PASSWORD'));
    }
    return toReturn;
}

function passCustomCheck(mail, password, req) {
    return (mail.toUpperCase() !== password.toUpperCase());
}

module.exports = {
    isStrong: isStrong,
    getWeaknessesMsg: getWeaknessesMsg,
    getWeaknesses: getWeaknesses,
};