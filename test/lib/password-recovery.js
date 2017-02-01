"use strict";

var db = require('../../models');
var codeHelper = require('../../lib/code-helper');
var config = require('../../config');


describe('Test password recovery code', function () {
    context('When tries to recover password', function () {
        var self = this;
        before(function (done) {
            db.User.create({
                id: 1,
                email: 'user1@earth.com',
                provider_uid: 'testuser',
                display_name: 'Test User 1'
            }).then(function (user) {
                self.user = user;
                user.setPassword('mdp');
                codeHelper.generatePasswordRecoveryCode(user).then(function (recoverCode) {
                    self.recoverCode = recoverCode;
                    self.currentPass = user.password;
                    done();
                });

            });

        })
        it('should do nothing when code is empty', function (done) {
            codeHelper.recoverPassword(self.user, '', 'new pass').then(function (res) {
                expect(res).to.be.false;
                expect(self.currentPass).to.be.equal(self.user.password);
                done();
            });
        });
        it('should do nothing when code is wrong', function (done) {
            codeHelper.recoverPassword(self.user, 'wrong code', 'new pass').then(function (res) {
                expect(res).to.be.false;
                expect(self.currentPass).to.be.equal(self.user.password);
                done();
            });
        });
        it('should  udpate the password and remove recovery code stuff', function (done) {
            codeHelper.recoverPassword(self.user, self.recoverCode, 'new pass').then(function (res) {
                expect(res).to.be.true;
                expect(self.currentPass).not.to.be.equal(self.user.password);
                done();
            });
        });
    })
    //context('When tries to recover password with expired code', function () {
    //    var self = this;
    //    before(function (done) {
    //        db.User.create({
    //            id: 2,
    //            email: 'user2@earth.com',
    //            provider_uid: 'testuser2',
    //            display_name: 'Test User 2'
    //        }).then(function (user) {
    //            self.user = user;
    //            user.setPassword('mdp');
    //            codeHelper.generatePasswordRecoveryCode(user).then(function (recoverCode) {
    //                self.recoverCode = recoverCode;
    //                self.currentPass = user.password;
    //                done();
    //            });
    //
    //        });
    //
    //    })
    //    it('should  not udpate the password and not remove recovery code stuff', function (done) {
    //        config.password.recovery_code_validity_duration = 0;
    //        codeHelper.recoverPassword(self.user, self.recoverCode, 'new pass').then(function (res) {
    //            expect(res).to.be.false;
    //            expect(self.currentPass).to.be.equal(self.user.password);
    //            done();
    //        });
    //    });
    //})


});