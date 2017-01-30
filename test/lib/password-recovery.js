"use strict";

var db = require('../../models');

describe('Test password recovery code', function () {
    context('When tries to recover password', function () {
        before(function (done) {
            this.user = db.User.build({
                id: 1,
                email: 'user1@earth.com',
                provider_uid: 'testuser',
                display_name: 'Test User 1'
            });
            this.user.setPassword('mdp');
            this.user.generateRecoveryCode();
            this.currentPass = this.user.password;
            done();
        })
        it('should do nothing when code is empty', function (done) {
            this.user.recoverPassword('', 'new pass');
            expect(this.user.password).to.be.equal(this.currentPass);
            done();
        });
        it('should do nothing when code is wrong', function (done) {
            this.user.recoverPassword('wrong code', 'new pass');
            expect(this.user.password).to.be.equal(this.currentPass);
            done();
        });
        it('should  udpate the password and remove recovery code stuff', function (done) {
            this.user.recoverPassword(this.user.passwordRecoveryCode, 'new pass');
            expect(this.user.password).not.to.be.equal(this.currentPass);
            expect(this.user.passwordRecoveryCode).to.be.null;
            expect(this.user.passwordRecoveryCodeDate).to.be.equal(0);
            done();
        });
    })
});