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

            this.user.setPassword('mdp').then(function (user){
                user.generateRecoveryCode();
                self.currentPass = user.password;
                //console.log("password yoyoyoy:", user.password);
                done();
            });
        })
        //it('should do nothing when code is empty', function (done) {
        //    this.user.recoverPassword('', 'new pass');
        //    expect(this.user.password).to.be.equal(this.currentPass);
        //    console.log("passwordRecoveryCode" +  this.user.passwordRecoveryCode);
        //    console.log("cool1" +  this.user.password + " compare with " + this.currentPass);
        //    done();
        //});
        //it('should do nothing when code is wrong', function (done) {
        //    this.user.recoverPassword('wrong code', 'new pass');
        //    expect(this.user.password).to.be.equal(this.currentPass);
        //    console.log("cool2" +  this.user.password + " compare with " + this.currentPass);
        //    done();
        //});
        it('should  udpate the password and remove recovery code stuff', function (done) {
            console.log("cool3-1"+ this.user.password + " compare with " + this.currentPass);
            this.user.recoverPassword(this.user.passwordRecoveryCode, 'new pass');
            console.log("cool3-2 " + this.user.password + " compare with " + this.currentPass);
            expect(this.user.password).not.to.be.equal(this.currentPass);
            console.log("cool3-3");
            expect(this.user.passwordRecoveryCode).to.be.empty();
            console.log("cool3-4");
            expect(this.user.passwordRecoveryCodeDate).to.be.equal(0);
            console.log("cool3-5");
            done();
        });
    })
});