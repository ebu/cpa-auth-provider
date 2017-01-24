"use strict";

var db = require('../../models');

describe('Test verification code', function () {
    context('When validating user account', function () {
            before (function (){
                this.user = db.User.build({
                    id: 1,
                    email: 'user1@earth.com',
                    provider_uid: 'testuser',
                    display_name: 'Test User 1'
                });
                this.user.genereateVerificationCode();
            })
        it('should return false when validation code is wrong', function (done) {
            expect(this.user.verifyAccount('this is a wrong code')).to.be.false;
            done();
        });
        it('should return true when validation code is correct', function (done) {
            expect(this.user.verifyAccount(this.user.verificationCode)).to.be.true;
            done();
        });
    })
});