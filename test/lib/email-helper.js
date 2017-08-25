/*jshint expr:true */
"use strict";

var config = require('../../config');

var emailHelper = require('../../lib/email-helper');

describe("emailHelper test templating", function () {
    context("when sending an email with default template", function () {
        var self = this;
        before(function (done) {
            emailHelper.send(
                config.mail.from,
                'from@from.ch',
                "validation-email",
                {log: false},
                {host: "htt://localhost:3000", mail: encodeURIComponent('a@aaa.aa'), code: encodeURIComponent('12345')},
                config.i18n.default_locale
            ).then(function () {
                self.ok = true;
                done();
            }).catch(function (err) {
                self.ok = false;
                self.err = err;
                done();
            });
        });
        it('should not crash', function () {
            expect(self.ok).to.equal(true);
        });
    });

    context("when sending an email with invalid template", function () {
        var self = this;
        before(function (done) {
            emailHelper.send(
                config.mail.from,
                'no-reply@t-online.de',
                'wrong-email-template',
                {log: false},
                {
                    host: "http://localhost:3000",
                    mail: encodeURIComponent('a@aaa.aa'),
                    code: encodeURIComponent('12345')
                },
                config.i18n.default_locale
            ).then(function () {
                self.ok = true;
                done();
            }).catch(function (err) {
                self.ok = false;
                self.err = err;
                done();
            });
        });
        it('should not crash', function () {
            expect(self.ok).to.equal(false);
            expect(self.err.code).to.equal('ENOENT');
        });
    });

    context("when sending an email with invalid template", function () {
        var self = this;
        before(function (done) {
            emailHelper.send(
                config.mail.from,
                'no-reply@t-online.de',
                'validation-email',
                {},
                {
                    host: "http://localhost:3000",
                    mail: encodeURIComponent('a@aaa.aa'),
                    code: encodeURIComponent('12345')
                },
                undefined
            ).then(function () {
                self.ok = true;
                done();
            }).catch(function (err) {
                self.ok = false;
                self.err = err;
                done();
            });
        });
        it('should not crash', function () {
            expect(self.ok).to.equal(true);
        });
    });
});


describe("broadcaster config", function () {
    it("should contains mail.form", function () {
        expect(config.mail.from).not.undefined;
    });
});