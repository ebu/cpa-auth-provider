"use strict";

var db = require('../../models');

describe('Test user profile', function () {
    context('When requesting display_name', function () {
        context('and the user don\'t have firstname or last name', function () {

            it('should save without error', function (done) {

                var user =  db.User.build({
                    id: 1,
                    email: 'user1@earth.com',
                    provider_uid: 'testuser',
                    display_name: 'Test User 1'
                });
                var user_profile =  db.UserProfile.build({
                    id: 1,
                    firstname: 'firstname',
                    lastname: 'lastname',
                    gender: 'gender',
                    birthdate: 'birthdate',
                    user_id: 1
                });
                expect(user_profile.getDisplayName(user, 'FIRST_NAME')).to.equal('user1@earth.com');

                done();
            });
        })
    })
});