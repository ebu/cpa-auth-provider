/*jshint expr:true */
"use strict";

var db = require('../../models');
var codeHelper = require('../../lib/code-helper');
var requestHelper = require('../request-helper');
var config = require('../../config');
var dbHelper = require('../db-helper');

var resetDatabase = function (done) {
    dbHelper.clearDatabase(function (err) {
        if (err) {
            done(err);
        }
        done();
    });
};

var PASSWORD = {
    strong: "Mytestpassword.isthebest",
    weak: "weakpassword"
};

describe('Test password recovery code', function () {
    context('When tries to recover password', function () {
        var self = this;

        before(resetDatabase);

        before(function (done) {
            db.User.create({
                id: 1,
                provider_uid: 'testuser',
                display_name: 'Test User 1'
            }).then(function (user) {
                self.user = user;
                return db.LocalLogin.create({user_id: user.id, login: 'user1@earth.com'}).then(function (localLogin) {
                    return localLogin.setPassword('mdp').then(function () {
                        return codeHelper.generatePasswordRecoveryCode(user.id).then(function (recoverCode) {
                            self.recoverCode = recoverCode;
                            self.currentPass = localLogin.password;
                            done();
                        });
                    });
                });
            });
        });

        it('should do nothing when code is empty', function (done) {
            codeHelper.recoverPassword(self.user, '', 'new pass').then(function (res) {
                db.LocalLogin.find({where: {user_id: self.user.id}}).then(function (localLogin) {
                    expect(res).to.be.false;
                    expect(self.currentPass).to.be.equal(localLogin.password);
                    done();
                });
            });
        });
        it('should do nothing when code is wrong', function (done) {
            codeHelper.recoverPassword(self.user, 'wrong code', 'new pass').then(function (res) {
                db.LocalLogin.find({where: {user_id: self.user.id}}).then(function (localLogin) {
                    expect(res).to.be.false;
                    expect(self.currentPass).to.be.equal(localLogin.password);
                    done();
                });
            });
        });
        it('should  udpate the password and remove recovery code stuff', function (done) {
            codeHelper.recoverPassword(self.user, self.recoverCode, 'new pass').then(function (res) {
                db.LocalLogin.find({where: {user_id: self.user.id}}).then(function (localLogin) {
                    expect(res).to.be.true;
                    expect(self.currentPass).not.to.be.equal(localLogin.password);
                    done();
                });
            });
        });
    });

    context('When tries to recover password several time', function () {
        var self = this;

        before(resetDatabase);

        before(function (done) {
            db.User.create({
                id: 2,
                provider_uid: 'testuser2',
                display_name: 'Test User 2'
            }).then(function (user) {
                self.user = user;
                return db.LocalLogin.create({user_id: user.id, login: 'user2@earth.com'}).then(function (localLogin) {
                    return localLogin.setPassword('mdp').then(function () {
                        return codeHelper.generatePasswordRecoveryCode(user.id).then(function (recoverCode) {
                            self.recoverCode = recoverCode;
                            self.currentPass = localLogin.password;
                            done();
                        });
                    });
                });
            });
        });
        it('should  udpate the password and remove recovery code stuff', function (done) {
            codeHelper.recoverPassword(self.user, self.recoverCode, 'new pass').then(function (res) {
                db.LocalLogin.find({where: {user_id: self.user.id}}).then(function (localLogin) {
                    expect(res).to.be.true;
                    expect(self.currentPass).not.to.be.equal(localLogin.password);
                    done();
                });
            });
        });
    });

    context('When tries to recover password with expired code', function () {
        var self = this;

        before(resetDatabase);

        before(function (done) {
            db.User.create({
                id: 3,
                provider_uid: 'testuser3',
                display_name: 'Test User 3'
            }).then(function (user) {
                self.user = user;
                return db.LocalLogin.create({user_id: user.id, login: 'user3@earth.com'}).then(function (localLogin) {
                    self.localLogin = localLogin;
                    return localLogin.setPassword('mdp').then(function () {
                        return codeHelper.generatePasswordRecoveryCode(user.id).then(function (recoverCode) {
                            self.recoverCode = recoverCode;
                            self.currentPass = localLogin.password;
                            done();
                        });
                    });
                });
            });
        });
        it('should  not udpate the password and not remove recovery code stuff', function (done) {
            // Save the config val to restore it after the test
            var duration = config.password.recovery_code_validity_duration;
            config.password.recovery_code_validity_duration = -1800;
            codeHelper.recoverPassword(self.user, self.recoverCode, 'new pass').then(function (res) {
                db.LocalLogin.find({where: {user_id: self.user.id}}).then(function (localLogin) {
                    expect(res).to.be.false;
                    expect(self.currentPass).to.be.equal(self.localLogin.password);
                    // restore the config
                    config.password.recovery_code_validity_duration = duration;
                    done();
                });
            });
        });
    });


    context('When tries to recover password with multiple user in db', function () {
        var self = this;

        before(resetDatabase);

        before(function (done) {
            db.User.create({
                id: 5,
                provider_uid: 'testuser5',
                display_name: 'Test User 5'
            }).then(function (user) {
                self.user = user;
                return db.LocalLogin.create({user_id: user.id, login: 'user5@earth.com'}).then(function (localLogin) {
                    self.localLogin = localLogin;
                    return localLogin.setPassword('mdp').then(function () {
                        return codeHelper.generatePasswordRecoveryCode(user.id).then(function (recoverCode) {
                            self.recoverCode = recoverCode;
                            self.currentPass = localLogin.password;
                            done();
                        });
                    });
                });
            });
        });
        before(function (done) {
            db.User.create({
                id: 6,
                provider_uid: 'testuser6',
                display_name: 'Test User 6'
            }).then(function (user) {
                self.user2 = user;
                return db.LocalLogin.create({user_id: user.id, login: 'user6@earth.com'}).then(function (localLogin) {
                    return localLogin.setPassword('mdp').then(function () {
                        return codeHelper.generatePasswordRecoveryCode(user.id).then(function (recoverCode) {
                            self.recoverCode2 = recoverCode;
                            self.currentPass2 = localLogin.password;
                            done();
                        });
                    });
                });
            });
        });
        it('should  udpate the password and remove recovery code stuff', function (done) {
            codeHelper.recoverPassword(self.user, self.recoverCode, 'new pass').then(function (res) {
                db.LocalLogin.find({where: {user_id: self.user.id}}).then(function (localLogin) {
                    expect(res).to.be.true;
                    expect(self.currentPass).not.to.be.equal(localLogin.password);
                    done();
                });
            });

        });
        it('should  udpate the password and remove recovery code stuff', function (done) {
            codeHelper.recoverPassword(self.user2, self.recoverCode2, 'new pass').then(function (res) {
                db.LocalLogin.find({where: {user_id: self.user2.id}}).then(function (localLogin) {
                    expect(res).to.be.true;
                    expect(self.currentPass2).not.to.be.equal(localLogin.password);
                    done();
                });
            });
        });
    });


})
;

describe('Test password update code', function () {
    context('When we try to update password with POST password/update endpoint and not strong password then try with a strong password', function () {

        var self = this;
        var res1 = null;

        before(resetDatabase);

        before(function (done) {
            db.User.create({
                id: 1,
                provider_uid: 'testuser',
                display_name: 'Test User'
            }).then(function (user) {
                self.user = user;
                return db.LocalLogin.create({
                    user_id: user.id,
                    login: 'testuser@testuser.com'
                }).then(function (localLogin) {
                    return localLogin.setPassword('mdp').then(function () {
                        return codeHelper.generatePasswordRecoveryCode(user.id).then(function (recoverCode) {
                            self.recoverCode = recoverCode;
                            self.currentPass = user.password;
                            done();
                        });
                    });
                });
            });
        });

        before(function (done) {
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/password/update', {
                method: 'post',
                data: {
                    password: PASSWORD.weak,
                    'confirm-password': PASSWORD.weak,
                    email: 'testuser@testuser.com',
                    code: self.recoverCode
                }
            }, done);
        });

        before(function (done) {
            res1 = self.res;
            requestHelper.sendRequest(self, '/password/update', {
                method: 'post',
                data: {
                    password: PASSWORD.strong,
                    'confirm-password': PASSWORD.strong,
                    email: 'testuser@testuser.com',
                    code: self.recoverCode
                }
            }, done);
        });

        it('should return http error code for first request and success for second one', function () {
            expect(res1.statusCode).to.equal(400);
            expect(self.res.statusCode).to.equal(200);
        });

    });

    context('When we try to update password with POST password/update endpoint and strong password', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            db.User.create({
                id: 1,
                provider_uid: 'testuser',
                display_name: 'Test User'
            }).then(function (user) {
                self.user = user;
                return db.LocalLogin.create({
                    user_id: user.id,
                    login: 'testuser@testuser.com'
                }).then(function (localLogin) {
                    return localLogin.setPassword('mdp').then(function () {
                        return codeHelper.generatePasswordRecoveryCode(user.id).then(function (recoverCode) {
                            self.recoverCode = recoverCode;
                            self.currentPass = user.password;
                            done();
                        });
                    });
                });
            });
        });

        before(function (done) {
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/password/update', {
                method: 'post',
                data: {
                    password: PASSWORD.strong,
                    'confirm-password': PASSWORD.strong,
                    email: 'testuser@testuser.com',
                    code: self.recoverCode
                }
            }, done);
        });

        it('should update password and return success http code', function () {
            expect(self.res.statusCode).to.equal(200);
        });

    });
});