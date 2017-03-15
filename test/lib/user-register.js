"use strict";

var db = require('../../models');
var codeHelper = require('../../lib/code-helper');


describe('Test verification code', function () {
    context('When validating user account', function () {
        var self = this;
        before(function (done) {
            db.User.create({
                id: 1,
                email: 'user1@earth.com',
                provider_uid: 'testuser',
                display_name: 'Test User 1'
            }).then(function (user){
                self.user = user;
                codeHelper.getOrGenereateEmailVerificationCode(user).then(
                    function(verificationCode){
                        self.verificationCode = verificationCode;
                        done();
                    }
                );
            });
        });
        it('should return false when validation code is empty', function (done) {
            codeHelper.verifyEmail(self.user, 'this is a wrong code').then(function (res) {
                expect(self.user.verified).to.be.undefined;
                expect(res).to.be.false;
                done();
            });
        });
        it('should return false when validation code is wrong', function (done) {
            codeHelper.verifyEmail(self.user, 'this is a wrong code').then(function (res) {
                expect(self.user.verified).to.be.undefined;
                expect(res).to.be.false;
                done();
            });
        });
        it('should return true when validation code is correct', function (done) {
            codeHelper.verifyEmail(self.user, self.verificationCode).then(function (res) {
                expect(self.user.verified).to.be.true;
                expect(res).to.be.true;
                done();
            });
        });
    });
});