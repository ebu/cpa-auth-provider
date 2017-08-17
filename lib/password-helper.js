/*jshint expr:true */
"use strict";
var owasp = require('owasp-password-strength-test');



function isStrong(password) {
    var owaspResult = owasp.test(password);
    return (!owaspResult.strong)
}

function getWeaknessMsg(password, req) {
    var owaspResult = owasp.test(password);

    var msg = req.__('BACK_SIGNUP_PASS_STRENGTH') + "<br>";
    for (var i = 0; i < owaspResult.failedTests.length; i++) {
        msg = msg + "\n - " + req.__('BACK_SIGNUP_PASS_STRENGTH_' + owaspResult.failedTests[i]) + "<br>";
    }
    return msg;
}

module.exports = {
    isStrong: isStrong,
    getWeaknessMsg: getWeaknessMsg
};