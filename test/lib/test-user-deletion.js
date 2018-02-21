"use strict";

/**
 * Users can schedule their deletion - or fail to achieve verified state.
 * In both cases their database entries need to be removed - on schedule.
 */

const db = require('../../models');
const dbHelper = require('../db-helper');
const oauthHelper = require('../oauth-helper');

const OLD_DATE = new Date("Tue Dec 12 2017 14:10:00 GMT+0000");
const RECENT_DATE = new Date("Sun Feb 11 2018 14:10:00 GMT+0000");
const NOW_DATE = new Date("Mon Feb 12 2018 14:10:00 GMT+0000");
const FUTURE_DATE = new Date("Tue Feb 13 2018 14:10:00 GMT+0000");

const CLIENT = {
    id: 1,
    client_id: "ClientA",
    client_secret: "ClientSecret",
    name: "OAuth 2.0 Client",
    redirect_uri: 'http://localhost'
};

const USER1 = {
    id: 1,
    email: 'test@test.com',
    verified: false,
    account_uid: 'RandomUid',
    password: 'areallylongandacceptedpassword',
    created_at: OLD_DATE,
};
const USER2 = {
    id: 2,
    email: 'some@one.else',
    account_uid: 'AnotherUid',
    password: '-=5h0rt!3ut!3e4t1fu1=-',
    created_at: RECENT_DATE,
};

const USER3 = {
    id: 3,
    account_uid: 'FacebookUid',
    created_at: OLD_DATE,
};
const USER4 = {
    id: 4,
    email: 'test4@test.com',
    verified: true,
    account_uid: 'RandomUid',
    password: 'areallylongandacceptedpassword',
    created_at: OLD_DATE,
};
const USER5 = {
    id: 5,
    email: 'test5@test.com',
    verified: true,
    account_uid: 'RandomUid',
    password: 'areallylongandacceptedpassword',
    created_at: OLD_DATE,
    scheduled_for_deletion_at: RECENT_DATE.getTime(),
};
const USER6 = {
    id: 6,
    email: 'test6@test.com',
    verified: true,
    account_uid: 'RandomUid',
    password: 'areallylongandacceptedpassword',
    created_at: OLD_DATE,
    scheduled_for_deletion_at: FUTURE_DATE.getTime(),
};

const USERS = [USER1, USER2, USER3, USER4, USER5, USER6];
const SOCIAL_LOGINS = [
    {user_id: 3, name: 'facebook', uid: 'special_345'}
];

describe('user-deletion', () => {
    const userDeletion = require('../../lib/user-deletion');
    context('deleting expired users', function () {
        before(function () {
            let time = new Date(NOW_DATE).getTime();
            this.clock = sinon.useFakeTimers(time);
        });
        after(function () {
            this.clock.restore();
        });
        before(resetDatabase);

        before(function (done) {
            userDeletion.deleteVerificationFailUsers().then(
                count => {
                    this.delete_count = count;
                    done();
                },
                done);
        });

        it('should have deleted the correct amount', function () {
            expect(this.delete_count).equal(1);
        });

        it('should have deleted non-verified, old user', function (done) {
            db.User.findOne({where: {id: USER1.id}}).then(
                user => {
                    expect(user).equal(null);
                    done();
                },
                done
            );
        });

        it('should not have deleted non-verified, recent user', function (done) {
            db.User.findOne({where: {id: USER2.id}}).then(
                user => {
                    expect(user).a('Object');
                    done();
                },
                done
            );
        });

        it('should not have deleted social account, old user', function (done) {
            db.User.findOne({where: {id: USER3.id}}).then(
                user => {
                    expect(user).a('Object');
                    done();
                },
                done
            );
        });

        it('should not have deleted verified user', function (done) {
            db.User.findOne({where: {id: USER4.id}}).then(
                user => {
                    expect(user).a('Object');
                    done();
                },
                done
            );
        });
        it('should not have deleted verified user scheduled for deletion', function (done) {
            db.User.findOne({where: {id: USER5.id}}).then(
                user => {
                    expect(user).a('Object');
                    done();
                },
                done
            );
        });
        it('should not have deleted verified user scheduled for deletion in the future', function (done) {
            db.User.findOne({where: {id: USER6.id}}).then(
                user => {
                    expect(user).a('Object');
                    done();
                },
                done
            );
        });
    });

    context('execute scheduled deletion', function () {
        before(function () {
            let time = new Date(NOW_DATE).getTime();
            this.clock = sinon.useFakeTimers(time);
        });
        after(function () {
            this.clock.restore();
        });
        before(resetDatabase);

        before(function (done) {
            userDeletion.deleteExpiredUsers().then(
                count => {
                    this.delete_count = count;
                    done();
                },
                done);
        });

        it('should have deleted the correct amount', function () {
            expect(this.delete_count).equal(1);
        });

        it('should not have deleted non-verified, old user', function (done) {
            db.User.findOne({where: {id: USER1.id}}).then(
                user => {
                    expect(user).a('Object');
                    done();
                },
                done
            );
        });

        it('should not have deleted non-verified, recent user', function (done) {
            db.User.findOne({where: {id: USER2.id}}).then(
                user => {
                    expect(user).a('Object');
                    done();
                },
                done
            );
        });

        it('should not have deleted social account, old user', function (done) {
            db.User.findOne({where: {id: USER3.id}}).then(
                user => {
                    expect(user).a('Object');
                    done();
                },
                done
            );
        });

        it('should not have deleted verified user', function (done) {
            db.User.findOne({where: {id: USER4.id}}).then(
                user => {
                    expect(user).a('Object');
                    done();
                },
                done
            );
        });

        it('should have deleted verified user scheduled for deletion', function (done) {
            db.User.findOne({where: {id: USER5.id}}).then(
                user => {
                    expect(user).equal(null);
                    done();
                },
                done
            );
        });
        it('should not have deleted verified user scheduled for deletion in the future', function (done) {
            db.User.findOne({where: {id: USER6.id}}).then(
                user => {
                    expect(user).a('Object');
                    done();
                },
                done
            );
        });
    });
});


function resetDatabase(done) {
    dbHelper.clearDatabase(
        err => {
            if (err) {
                return done(err);
            } else {
                oauthHelper.createOAuth2Clients([CLIENT]).then(
                    () => {
                        return oauthHelper.createUsers(USERS);
                    }
                ).then(
                    () => {
                        return db.SocialLogin.bulkCreate(SOCIAL_LOGINS);
                    }
                ).then(
                    () => {
                        done();
                    }
                ).catch(
                    done
                );
            }
        }
    );
}
