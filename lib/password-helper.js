"use strict";

var owasp = require('owasp-password-strength-test');

function isStrong(mail, password, req) {
    var owaspResult = owasp.test(password);
    return (owaspResult.strong && customCheck(mail, password, req).length === 0);
}

function getWeaknessesMsg(mail, password, req) {
    var owaspResult = owasp.test(password);

    var msg = req.__('BACK_SIGNUP_PASS_STRENGTH') + "<br/>";
    for (var i = 0; i < owaspResult.failedTests.length; i++) {
        msg = msg + " - " + req.__('BACK_SIGNUP_PASS_STRENGTH_' + owaspResult.failedTests[i]) + "<br/>";
    }
    var check = customCheck(mail, password, req);
    for (var c = 0; i < check.length; c++) {
        msg = msg + " - " + check[c] + "<br/>";
    }

    return msg;
}

function getWeaknesses(password, req) {
    var owaspResult = owasp.test(password);

    var toReturn = [];
    for (var i = 0; i < owaspResult.failedTests.length; i++) {
        toReturn.push(req.__('BACK_SIGNUP_PASS_STRENGTH_' + owaspResult.failedTests[i]));
    }
    return toReturn;
}

function customCheck(mail, password, req) {
    var toReturn = [];
    if (mail.toUpperCase() === password.toUpperCase()) {
        toReturn.push(req.__('BACK_SIGNUP_EMAIL_EQUALS_PASSWORD'));
    }
    return toReturn;
}

module.exports = {
    isStrong: isStrong,
    getWeaknessesMsg: getWeaknessesMsg,
    getWeaknesses: getWeaknesses,
};