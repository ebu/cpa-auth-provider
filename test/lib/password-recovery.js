"use strict";

var db = require('../../models');

describe('Test password recovery code', function () {
    context('When tries to recover password', function () {
        before(function (done) {
        	var self = this;
            this.user = db.User.build({
                id: 1,
                email: 'user1@earth.com',
                provider_uid: 'testuser',
                display_name: 'Test User 1'
            });
            this.user.setPassword('mdp').then(
                function() {
					self.user.generateRecoveryCode();
					self.currentPass = self.user.password;
					done();
                }
            );
        });
        it('should do nothing when code is empty', function (done) {
        	var self = this;
            this.user.recoverPassword('', 'new pass').then(
                function() {
					expect(self.user.password).to.be.equal(self.currentPass);
					done();
                },
				function() {
					expect(self.user.password).to.be.equal(self.currentPass);
					done();
				}
            );
        });
        it('should do nothing when code is wrong', function (done) {
        	var self = this;
            this.user.recoverPassword('wrong code', 'new pass').then(
                function() {
					expect(self.user.password).to.be.equal(self.currentPass);
					done();
                },
				function() {
					expect(self.user.password).to.be.equal(self.currentPass);
					done();
				}
            );
        });
        it('should  udpate the password and remove recovery code stuff', function (done) {
        	var self = this;
            this.user.recoverPassword(this.user.passwordRecoveryCode, 'new pass').then(
                function() {
					expect(self.user.password).not.to.be.equal(self.currentPass);
					expect(self.user.passwordRecoveryCode).to.be.null;
					expect(self.user.passwordRecoveryCodeDate).to.be.equal(0);
					done();
                }
            );
        });
    })
});