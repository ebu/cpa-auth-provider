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
var OLD_PASSWORD = '1234567890';
var NEW_PASSWORD = 'abcdefghijklmn';

// Test authenticate

describe('user profile timestamps', function () {
    context('account creation', function () {
        before(function (done) {
            var time = new Date("Wed Jan 29 2017 05:17:00 GMT+0000").getTime();
            this.clock = sinon.useFakeTimers(time, "Date");

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
                        'g-recaptcha-response': '03AHJ_VuumGMJjbAPsRZf8KVVS_KR3uNwheBf3XefbSN9RmY1wnFvpTUYM5SHAoDeodK4a8cqBElvDA3rJPEu-z18r7ZlmMF1BUbDKnZsGvJqlnv7pwFofpoSyz9ltPWgH95Opovv8Yxw1yRwWnqgpw3242sR3q-EQkoqdJIZJBOziKRrtcgHOs8cMzKnvPlO5_LCT1Xf5e3AxsHsbbPSilME2WygfMELGrbq30Kb3rOL65RVg_gsuTMqxArOa9AQHxpGTx-IzYoWpjMmmCG5S1jna73xtkIB0dQuuv-J0on7U5yspn0UBNpaVslp5xa7PEjJSAQxU6yY4D8EnC2DsqnZT6bvxLNVRVJiX6HCjYnX7BvF1PRTaxrmJrZSd5yUjLxAG_QNroSwOF_hQhBprtQkSOIdEL1FlxG9PKy4wUttq3xRpgvBewOUiVMSa-m8Zr74CpsKnmU3aANqjPjDS15LjZ4zUY-qIYVQbRcw0FjBsOFwO7nqtlBfQC4ebKSgOfh31S2qXIcEY7mCxdj9MIxyqdalLwrFogrBzrQvH9CCkNizmTno0gWtWbE-obpB_EXgQ87du2FRADpHOhGmq-ic0yPZfs27an5xJrcuCOcTLOnED_RYzLETpyJ6ckYvlRsOGyGUbr-60wiLKb8ipeQkidPtMQqwd3c7bmDtk6BcIBEdm80tj_D-1YVxUdDtVmJw99RofQyVOoP2JVun0fquw4ylp_XimetVlvfjONpbmjRiRpaPUcosu0aQwZw20VTd10WFBfqIA3LUR2bKdG_JM2ODxPUg7FMVRMHIOOL0zUwxXdHSJeH8ek-vpOhJuh3vLeG3norWT1AEBOHpdHoFvlPB08u98b0cwzgJElpETn4rAdz7ad6vJL7Gee5wR0jJcqZPIdmCMZjBC4U7REletboN5JeYvK6ZMlG43o5uNAN4GH8h5VPQ'
                    }
                },
                done);
        });

        it('should return a success false', function () {
            // if Test fail  here google should have change the recaptcha algorithm
            // => update recaptchaResponse by getting the value post as parameter g-recaptcha-response in signup query using a browser
            expect(this.res.body.msg).to.not.equal("msg:Something went wrong with the reCAPTCHA");
        });

        before(function (done) {
            var self = this;
            this.clock.restore();
            this.clock = sinon.useFakeTimers(new Date("Wed Feb 01 2017 11:42:00 GMT+0000").getTime(), "Date");
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
            this.clock = sinon.useFakeTimers(new Date("Wed Feb 08 2017 15:37:00 GMT+0000").getTime(), "Date");
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