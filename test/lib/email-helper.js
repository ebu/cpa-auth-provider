"use strict";

var emailHelper = require('../../lib/email-helper');

describe("send", function() {
    it("should not crash", function() {
        emailHelper.send("from", "to", "body", {test:true}, function() {});
    });
});
