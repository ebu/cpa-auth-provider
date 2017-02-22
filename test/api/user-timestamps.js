"use strict";

var messages = require('../../lib/messages');
var db = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

var resetDatabase = function (done) {
    dbHelper.clearDatabase(function (err) {
        done(err);
    });
};


var TEST_EMAIL_0 = 'qsdf@qsdf.fr';

// Test authenticate

describe('user profile timestamps', function () {
    context('account creation', function () {
        var start_at = Date.now();
        before(resetDatabase);
        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: TEST_EMAIL_0,
                    password: 'qsdf',
                    'g-recaptcha-response': '03AHJ_VuumGMJjbAPsRZf8KVVS_KR3uNwheBf3XefbSN9RmY1wnFvpTUYM5SHAoDeodK4a8cqBElvDA3rJPEu-z18r7ZlmMF1BUbDKnZsGvJqlnv7pwFofpoSyz9ltPWgH95Opovv8Yxw1yRwWnqgpw3242sR3q-EQkoqdJIZJBOziKRrtcgHOs8cMzKnvPlO5_LCT1Xf5e3AxsHsbbPSilME2WygfMELGrbq30Kb3rOL65RVg_gsuTMqxArOa9AQHxpGTx-IzYoWpjMmmCG5S1jna73xtkIB0dQuuv-J0on7U5yspn0UBNpaVslp5xa7PEjJSAQxU6yY4D8EnC2DsqnZT6bvxLNVRVJiX6HCjYnX7BvF1PRTaxrmJrZSd5yUjLxAG_QNroSwOF_hQhBprtQkSOIdEL1FlxG9PKy4wUttq3xRpgvBewOUiVMSa-m8Zr74CpsKnmU3aANqjPjDS15LjZ4zUY-qIYVQbRcw0FjBsOFwO7nqtlBfQC4ebKSgOfh31S2qXIcEY7mCxdj9MIxyqdalLwrFogrBzrQvH9CCkNizmTno0gWtWbE-obpB_EXgQ87du2FRADpHOhGmq-ic0yPZfs27an5xJrcuCOcTLOnED_RYzLETpyJ6ckYvlRsOGyGUbr-60wiLKb8ipeQkidPtMQqwd3c7bmDtk6BcIBEdm80tj_D-1YVxUdDtVmJw99RofQyVOoP2JVun0fquw4ylp_XimetVlvfjONpbmjRiRpaPUcosu0aQwZw20VTd10WFBfqIA3LUR2bKdG_JM2ODxPUg7FMVRMHIOOL0zUwxXdHSJeH8ek-vpOhJuh3vLeG3norWT1AEBOHpdHoFvlPB08u98b0cwzgJElpETn4rAdz7ad6vJL7Gee5wR0jJcqZPIdmCMZjBC4U7REletboN5JeYvK6ZMlG43o5uNAN4GH8h5VPQ'
                }
            }, done);
        });

        it('should be set to proper time', function (done) {
            db.User.findOne({where: {email: TEST_EMAIL_0}}).then(
                function(user) {
                    expect(user.created_at.getTime()).above(start_at);
                    done();
                },
                function() {
                    done();
                }
            );
        });
    });


});