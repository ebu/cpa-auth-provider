"use strict";

var emailHelper = require('../../lib/email-helper');
var config = require('../../config');

describe("send", function() {
    it("should not crash", function() {
        emailHelper.send(config.mail.from, 'from@from.ch', "validation-email", {log:false}, {host:"htt://localhost:3000", mail:'a@aaa.aa', code:'12345'}, config.mail.locale, function() {});

    });

});

describe("broadcaster config", function() {
    it("should contains mail.form", function() {
        expect(config.mail.from).defined;
    });
});


