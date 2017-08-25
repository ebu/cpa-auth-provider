"use strict";

var db = require('../../models');
var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

var resetDatabase = function (done) {
    dbHelper.clearDatabase(function (err) {
        done(err);
    });
};


var TEST_EMAIL_0 = 'qsdf@qsdf.fr';
var OLD_PASSWORD = 'correct horse battery staple';
var NEW_PASSWORD = 'correct horse battery staple 42';
var recaptchaResponse = 'a dummy recaptcha response';

// Test authenticate

describe('user profile timestamps', function () {
    context('account creation', function () {
        before(function (done) {
            var time = new Date("Wed Jan 29 2017 05:17:00 GMT+0000").getTime();
            this.clock = sinon.useFakeTimers(time);

            this.start_at = Date.now();
            done();
        });

        after(function () {
            this.clock.restore();
        });

        before(resetDatabase);
        before(function (done) {
            requestHelper.sendRequest(
                this,
                '/api/local/signup',
                {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        email: TEST_EMAIL_0,
                        password: OLD_PASSWORD,
                        'g-recaptcha-response': recaptchaResponse
                    }
                },
                done);
        });

        it('should return a success false', function () {
            expect(this.res.body.msg).to.not.equal("msg:Something went wrong with the reCAPTCHA");
        });

        before(function (done) {
            var self = this;
            this.clock.restore();
            this.clock = sinon.useFakeTimers(new Date("Wed Feb 01 2017 11:42:00 GMT+0000").getTime());
            this.login_at = Date.now();
            requestHelper.sendRequest(
                self,
                '/login',
                {
                    method: 'post',
                    cookie: self.cookie,
                    type: 'form',
                    data: {
                        email: TEST_EMAIL_0,
                        password: OLD_PASSWORD
                    }
                },
                done
            );
        });

        before(function (done) {
            var self = this;
            this.clock.restore();
            this.clock = sinon.useFakeTimers(new Date("Wed Feb 08 2017 15:37:00 GMT+0000").getTime());
            this.change_at = Date.now();
            db.User.findOne({where: {email: TEST_EMAIL_0}}).then(
                function (user) {
                    user.setPassword(NEW_PASSWORD).then(
                        function () {
                            done();
                        },
                        done
                    );
                },
                done
            );
        });

        before(function (done) {
            var self = this;
            requestHelper.sendRequest(
                self,
                '/login',
                {
                    method: 'post',
                    cookie: self.cookie,
                    type: 'form',
                    data: {
                        email: TEST_EMAIL_0,
                        password: OLD_PASSWORD
                    }
                },
                done
            );
        });


        it('should be set to proper time', function (done) {
            var self = this;
            db.User.findOne({where: {email: TEST_EMAIL_0}}).then(
                function (user) {
                    try {
                        expect(user.created_at.getTime()).equal(self.start_at);
                    } catch (e) {
                        return done(e);
                    }
                    done();
                },
                done
            );
        });

        it('should have proper password set time', function (done) {
            var self = this;
            db.User.findOne({where: {email: TEST_EMAIL_0}}).then(
                function (user) {
                    try {
                        expect(user.password_changed_at).equal(self.change_at);
                    } catch (e) {
                        return done(e);
                    }
                    done();
                },
                done
            );
        });

        it('should have proper last login time', function (done) {
            var self = this;
            db.User.findOne({where: {email: TEST_EMAIL_0}}).then(
                function (user) {
                    try {
                        expect(user.last_login_at).equal(self.login_at);
                    } catch (e) {
                        return done(e);
                    }
                    done();
                },
                done
            );
        });
    });


});