/*jshint expr:true */
"use strict";
var owasp = require('owasp-password-strength-test');



function isStrong(password) {
    var owaspResult = owasp.test(password);
    return (owaspResult.strong)
}

function getWeaknessesMsg(password, req) {
    var owaspResult = owasp.test(password);

    var msg = req.__('BACK_SIGNUP_PASS_STRENGTH') + "<br/>";
    for (var i = 0; i < owaspResult.failedTests.length; i++) {
        msg = msg + " - " + req.__('BACK_SIGNUP_PASS_STRENGTH_' + owaspResult.failedTests[i]) + "<br/>";
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

module.exports = {
    isStrong: isStrong,
    getWeaknessesMsg: getWeaknessesMsg,
    getWeaknesses: getWeaknesses
};