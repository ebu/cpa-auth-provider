"use strict";

var db = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');
var config = require('../../config');

var initDatabase = function (done) {

    db.Permission
        .create({
                id: 2,
                label: "other"
            }
        ).then(function () {
        db.User.create({
            id: 5,
            provider_uid: 'testuser'
        })
            .then(function (user) {
                return db.LocalLogin.create({user_id: user.id, login: 'testuser'}).then(function (localLogin) {
                    return localLogin.setPassword('testpassword');
                });
            })
            .then(function (user) {
                return user.updateAttributes({permission_id: 2});
            })
            .then(
                function () {
                    done();
                },
                function (error) {
                    done(new Error(error));
                });
    });

};

var resetDatabase = function (done) {
    dbHelper.clearDatabase(function (err) {
        if (err) {
            done(err);
        }
        else {
            initDatabase(done);
        }
    });
};

describe('POST /i18n/cookie', function () {

    context('When the user is not authenticated', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(self, '/i18n/cookie', {
                method: 'post',
                data: {language: 'fr'}
            }, done);
        });

        it('should return status 200 and cookie should be updated', function () {
            expect(self.res.statusCode).to.equal(200);
            //TODO expect cookies
        });

    });
});
describe('POST /i18n/profile', function () {

    context('When the user is authenticated and he request to update profile', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/i18n/profile', {
                cookie: self.cookie,
                method: 'post',
                data: {language: 'fr'}
            }, done);
        });

        before(function (done) {
            db.User.find({where: {id: 5}}).then(function (user) {
                self.user = user;
            }).then(function () {
                done();
            });
        });

        it('should return status 200', function () {
            expect(self.res.statusCode).to.equal(200);
        });


        it('should contain the profile with language \'fr\'', function () {
            expect(self.user.language).to.equal('fr');
        });


    });

    context('When the user is unauthenticated and he request to update profile', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(self, '/i18n/profile', {
                cookie: self.cookie,
                method: 'post',
                data: {language: 'fr'}
            }, done);
        });

        it('should return status 403', function () {
            expect(self.res.statusCode).to.equal(401);
        });


    });

});