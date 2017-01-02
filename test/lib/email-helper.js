"use strict";

var emailHelper = require('../../lib/email-helper');
var config = require('../../config');

describe("send", function() {
    it("should not crash", function() {
        emailHelper.send("from", "to", "this is the template body designed by {{=it.name}}", {log:false}, {name:'dom'}, function() {});
    });

});

describe("broadcaster config", function() {
    it("should contains mail.form", function() {
        expect(config.broadcaster.mail.from).to.be.defined;
    });
});


