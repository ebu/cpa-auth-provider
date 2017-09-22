"use strict";

var db = require('../../models');

describe('Test user profile', function () {
    context('When requesting display_name', function () {
        context('and the user don\'t have firstname or last name', function () {

            it('should save without error', function (done) {

                var user = db.User.build({
                    id: 1,
                    email: 'user1@earth.com',
                    provider_uid: 'testuser',
                    display_name: 'Test User 1'
                });
                var user_profile = db.UserProfile.build({
                    id: 1,
                    user_id: 1
                });

                expect(user_profile.getDisplayName(user, 'FIRSTNAME')).to.equal('user1@earth.com');
                expect(user_profile.getDisplayName(user, 'LASTNAME')).to.equal('user1@earth.com');
                expect(user_profile.getDisplayName(user, 'FIRSTNAME_LASTNAME')).to.equal('user1@earth.com');
                expect(user_profile.getDisplayName(user, 'EMAIL')).to.equal('user1@earth.com');

                user_profile = db.UserProfile.build({
                    id: 1,
                    lastname: 'lastname',
                    gender: 'gender',
                    date_of_birth: 'date_of_birth',
                    language: 'en',
                    user_id: 1
                });

                expect(user_profile.getDisplayName(user, 'FIRSTNAME')).to.equal('user1@earth.com');

                user_profile = db.UserProfile.build({
                    id: 1,
                    firstname: 'firstname',
                    gender: 'gender',
                    date_of_birth: 'date_of_birth',
                    language: 'en',
                    user_id: 1
                });

                expect(user_profile.getDisplayName(user, 'LASTNAME')).to.equal('user1@earth.com');
                user_profile = db.UserProfile.build({
                    id: 1,
                    lastname: 'lastname',
                    gender: 'gender',
                    date_of_birth: 'date_of_birth',
                    language: 'en',
                    user_id: 1
                });

                expect(user_profile.getDisplayName(user, 'FIRSTNAME_LASTNAME')).to.equal('user1@earth.com');

                user_profile = db.UserProfile.build({
                    id: 1,
                    firstname: 'firstname',
                    gender: 'gender',
                    date_of_birth: 'date_of_birth',
                    language: 'en',
                    user_id: 1
                });

                expect(user_profile.getDisplayName(user, 'FIRSTNAME_LASTNAME')).to.equal('user1@earth.com');

                user_profile = db.UserProfile.build({
                    id: 1,
                    firstname: 'firstname',
                    lastname: 'lastname',
                    gender: 'gender',
                    date_of_birth: 'date_of_birth',
                    language: 'en',
                    user_id: 1
                });

                expect(user_profile.getDisplayName(user, 'FIRSTNAME')).to.equal('firstname');
                expect(user_profile.getDisplayName(user, 'LASTNAME')).to.equal('lastname');
                expect(user_profile.getDisplayName(user, 'FIRSTNAME_LASTNAME')).to.equal('firstname lastname');
                expect(user_profile.getDisplayName(user, 'EMAIL')).to.equal('user1@earth.com');


                done();
            });
        });
    });
});