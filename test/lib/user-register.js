/*jshint expr:true */
"use strict";

var db = require('../../models');
var codeHelper = require('../../lib/code-helper');


describe('Test verification code', function () {
    context('When validating user account', function () {
        var self = this;
        before(function (done) {
            db.User.create({
                id: 1,
                display_name: 'Test User 1'
            }).then(function (user) {
                self.user = user;
                return db.LocalLogin.create({user_id: user.id, login: 'user1@earth.com'});
            }).then(function (localLogin) {
                self.localLogin = localLogin;
                codeHelper.getOrGenereateEmailVerificationCode(self.user).then(
                    function (verificationCode) {
                        self.verificationCode = verificationCode;
                        done();
                    }
                );
            });
        });
        it('should return false when validation code is empty', function (done) {
            codeHelper.verifyEmail(self.localLogin, 'this is a wrong code').then(function (res) {
                db.LocalLogin.findOne({where: {user_id: self.user.id}}).then(function (localLogin) {
                    expect(localLogin.verified).to.be.null;
                    expect(res).to.be.false;
                    done();
                });
            });
        });
        it('should return false when validation code is wrong', function (done) {
            codeHelper.verifyEmail(self.localLogin, 'this is a wrong code').then(function (res) {
                db.LocalLogin.findOne({where: {user_id: self.user.id}}).then(function (localLogin) {
                    expect(localLogin.verified).to.be.null;
                    expect(res).to.be.false;
                    done();
                });
            });
        });
        it('should return true when validation code is correct', function (done) {
            codeHelper.verifyEmail(self.localLogin, self.verificationCode).then(function (res) {
                db.LocalLogin.findOne({where: {user_id: self.user.id}}).then(function (localLogin) {
                    expect(localLogin.verified).to.be.true;
                    expect(res).to.be.true;
                    done();
                });
            });
        });
    });
});
