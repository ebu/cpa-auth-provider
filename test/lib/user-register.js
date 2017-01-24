"use strict";

var db = require('../../models');

describe('Test verification code', function () {
    context('When validating user account', function () {
        context('and the validating code is false', function () {
            var user;
            before (function (){
                user = db.User.build({
                    id: 1,
                    email: 'user1@earth.com',
                    provider_uid: 'testuser',
                    display_name: 'Test User 1'
                });
                user.genereateVerificationCode();
            })
            it('should return false', function (done) {
                expect(user.verifyAccount('this is a wrong code')).to.be.false;
                done();
            });
        })
    })
});