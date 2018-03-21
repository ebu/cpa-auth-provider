"use strict";

var db = require('../../models');

var dbHelper = require('../db-helper');
var requestHelper = require('../request-helper');
var config = require('../../config');

var initDatabase = function (done) {
    db.User.create({
        provider_uid: 'testuser'
    })
        .then(function (user) {
            return db.LocalLogin.create({user_id: user.id, login: 'testuser'}).then(function (localLogin) {
                return localLogin.setPassword('testpassword');
            });
        })
        .then(function () {
                done();
            },
            function (err) {
                done(new Error(err));
            });
};

var resetDatabase = function (done) {
    return dbHelper.resetDatabase(initDatabase, done);
};

describe('Test user profile', function () {

    context('When requesting display_name', function () {

        context('and the user don\'t have firstname or last name', function () {

            it('should save without error', function (done) {

                var user = db.User.build({
                    id: 1,
                    provider_uid: 'testuser',
                    display_name: 'Test User 1'
                });

                expect(user.getDisplayName('FIRSTNAME', 'user1@earth.com')).to.equal('user1@earth.com');
                expect(user.getDisplayName('LASTNAME', 'user1@earth.com')).to.equal('user1@earth.com');
                expect(user.getDisplayName('FIRSTNAME_LASTNAME', 'user1@earth.com')).to.equal('user1@earth.com');
                expect(user.getDisplayName('EMAIL', 'user1@earth.com')).to.equal('user1@earth.com');

                user = db.User.build({
                    id: 1,
                    provider_uid: 'testuser',
                    lastname: 'lastname',
                    gender: 'gender',
                    date_of_birth: 'date_of_birth',
                    language: 'en',
                    user_id: 1
                });

                expect(user.getDisplayName('FIRSTNAME', 'user1@earth.com')).to.equal('user1@earth.com');

                user = db.User.build({
                    id: 1,
                    provider_uid: 'testuser',
                    firstname: 'firstname',
                    gender: 'gender',
                    date_of_birth: 'date_of_birth',
                    language: 'en',
                    user_id: 1
                });

                expect(user.getDisplayName('LASTNAME', 'user1@earth.com')).to.equal('user1@earth.com');
                user = db.User.build({
                    id: 1,
                    provider_uid: 'testuser',
                    lastname: 'lastname',
                    gender: 'gender',
                    date_of_birth: 'date_of_birth',
                    language: 'en',
                    user_id: 1
                });

                expect(user.getDisplayName('FIRSTNAME_LASTNAME', 'user1@earth.com')).to.equal('user1@earth.com');

                user = db.User.build({
                    id: 1,
                    provider_uid: 'testuser',
                    firstname: 'firstname',
                    gender: 'gender',
                    date_of_birth: 'date_of_birth',
                    language: 'en',
                    user_id: 1
                });

                expect(user.getDisplayName('FIRSTNAME_LASTNAME', 'user1@earth.com')).to.equal('user1@earth.com');

                user = db.User.build({
                    id: 1,
                    provider_uid: 'testuser',
                    firstname: 'firstname',
                    lastname: 'lastname',
                    gender: 'gender',
                    date_of_birth: 'date_of_birth',
                    language: 'en',
                    user_id: 1
                });

                expect(user.getDisplayName('FIRSTNAME', 'user1@earth.com')).to.equal('firstname');
                expect(user.getDisplayName('LASTNAME', 'user1@earth.com')).to.equal('lastname');
                expect(user.getDisplayName('FIRSTNAME_LASTNAME', 'user1@earth.com')).to.equal('firstname lastname');
                expect(user.getDisplayName('EMAIL', 'user1@earth.com')).to.equal('user1@earth.com');


                done();
            });
        });

    });

});

describe('User profile page:', function () {

    before(resetDatabase);

    before(function () {
        config.userProfiles.requiredFields = ['firstname', 'lastname', 'date_of_birth'];
    });

    context('when requesting profile with mandatory fields', function () {

        before(function (done) {
            requestHelper.login(this, done);
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/user/profile', {cookie: this.cookie, parseDOM: true}, done);
        });

        it('should return a status 200', function () {
            config.userProfiles.requiredFields = [];
            expect(this.res.statusCode).to.equal(200);
        });

        it('should show asterisks for each mandatory field in the profile', function () {
            expect(this.$('span.required-asterisk').length).to.equal(3);
        });

    });

});

describe('User id API:', function () {

    before(resetDatabase);

    context('with good session cookie', function () {

        before(function (done) {
            requestHelper.login(this, done);
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/user/id', {cookie: this.cookie, parseDOM: true}, done);
        });

        it('should return a status 200', function () {
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.id).to.be.above(0);
        });

    });

    context('with wrong session cookie', function () {

        before(function (done) {
            requestHelper.sendRequest(this, '/user/id', {cookie: 'really wrong session cookie', parseDOM: true}, done);
        });

        it('should return a status 401', function () {
            expect(this.res.statusCode).to.equal(401);
        });

    });

});