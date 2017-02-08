"use strict";

var config = require('../../config');

var emailHelper = require('../../lib/email-helper');

describe("send", function() {
    it("should not crash", function(done) {
        emailHelper.send(
            config.mail.from,
            'from@from.ch',
            "validation-email",
            {log:false},
            {host:"htt://localhost:3000", mail:encodeURIComponent('a@aaa.aa'), code:encodeURIComponent('12345')},
            config.mail.locale
        ).then(
            function() {
            	console.log('--- success ---');
            },
            function(err) {
                console.log('--- fail ---', err);
                done();
            }
        );
    });
});

describe("broadcaster config", function() {
    it("should contains mail.form", function() {
        expect(config.mail.from).defined;
    });
});

describe('send', function() {
    it('should fail for invalid template', function(done) {
        emailHelper.send(
            config.mail.from,
            'no-reply@t-online.de',
            'wrong-email-template',
            {log: false},
			{host:"http://localhost:3000", mail:encodeURIComponent('a@aaa.aa'), code:encodeURIComponent('12345')},
            config.mail.locale
        ).then(
            function() {
            },
            function(err) {
                expect(err.code).equals('ENOENT');
                done();
            }
        );
    });

    it('should work for missing locale', function(done) {
		emailHelper.send(
			config.mail.from,
			'no-reply@t-online.de',
			'validation-email',
			{},
			{},
			undefined
		).then(
			function() {
			    console.log('--- successs ---');
			},
			function(err) {
			    console.log('--- fail ---', err);
				done();
			}
		);
    });
});



