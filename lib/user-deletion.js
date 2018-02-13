"use strict";
var db = require('../models');
var config = require('../config');
var emailHelper = require('./email-helper');

module.exports = {
    deleteExpiredUsers: deleteExpiredUsers,
    deleteVerificationFailUsers,
    cancelDeletion: cancelDeletion,
    scheduleForDeletion: scheduleForDeletion,
    start: start,
    stop: stop,
};

var DELETION_CONF = config.deletion || {};
var DELAY_DELETION_DAYS = DELETION_CONF.delay_in_days || 7;
var TIMEOUT = DELETION_CONF.delete_interval || 6 * 60 * 60;
var VERIFICATION_TIME = DELETION_CONF.verification_time || 48 * 60 * 60;

function scheduleForDeletion(user, client) {
    return new Promise(
        function (resolve, reject) {
            if (user.scheduled_for_deletion_at) {
                return resolve({msg: 'ALREADY_SCHEDULED', t: user.scheduled_for_deletion_at});
            }

            var deletionTime = new Date();
            deletionTime.setHours(deletionTime.getHours() + DELAY_DELETION_DAYS * 24);
            user.updateAttributes({scheduled_for_deletion_at: deletionTime}).then(
                function () {
                    var emailSent = user.verified;
                    if (emailSent) {
                        var link = client ? client.email_redirect_uri || client.redirect_uri : '';

                        emailHelper.send(
                            config.mail.from,
                            user.email,
                            "delete-notification",
                            {log: false},
                            {
                                link: link,
                                host: config.mail.host,
                                mail: user.email,
                            },
                            (user.UserProfile && user.UserProfile.language) ? user.UserProfile.language : config.mail.local
                        ).then(
                            function () {
                            },
                            function (e) {
                                console.log(e);
                            }
                        );
                    }
                    return resolve({msg: 'SCHEDULED', t: user.scheduled_for_deletion_at, email_sent: emailSent});
                }
            ).catch(reject);
        }
    );
}

function cancelDeletion(user, client) {
    return new Promise(
        function (resolve, reject) {
            if (!user.scheduled_for_deletion_at) {
                return resolve(false);
            }

            user.updateAttributes({scheduled_for_deletion_at: null}).then(
                function () {
                    var emailSent = user.verified;
                    if (emailSent) {
                        var link = client ? client.email_redirect_uri || client.redirect_uri : '';
                        emailHelper.send(
                            config.mail.from,
                            user.email,
                            "delete-cancelled-notification",
                            {log: false},
                            {
                                link: link,
                                host: config.mail.host,
                                mail: user.email,
                            },
                            (user.UserProfile && user.UserProfile.language) ? user.UserProfile.language : config.mail.local
                        ).then(
                            function () {
                            },
                            function (e) {
                                console.log(e);
                            }
                        );
                    }
                    return resolve(true);
                }
            ).catch(reject);
        }
    );
}


function deleteExpiredUsers() {
    return new Promise(
        function (resolve, reject) {
            db.User.destroy(
                {
                    where: {
                        scheduled_for_deletion_at: {
                            $lt: new Date()
                        }
                    }
                }
            ).then(
                resolve,
                reject
            );
        }
    );
}

function deleteVerificationFailUsers() {
    return new Promise(
        function (resolve, reject) {
            let transaction;
            let userIds = [];
            let localLoginIds = [];
            let verificationRequiredDate = new Date();
            let amountDeleted = 0;
            verificationRequiredDate.setSeconds(verificationRequiredDate.getSeconds() - VERIFICATION_TIME);

            db.User.findAll(
                {
                    where: {created_at: {$lt: verificationRequiredDate}},
                    include: {model: db.LocalLogin, where: {verified: {$not: true}}},
                }
            ).then(
                users => {
                    for (let i = 0; i < users.length; ++i) {
                        userIds.push(users[i].id);
                        localLoginIds.push(users[i].LocalLogin.id);
                    }

                    return db.SocialLogin.findAll({where: {user_id: userIds}});
                }
            ).then(
                socialLogins => {
                    for (let i = 0; i < socialLogins.length; ++i) {
                        let pos = userIds.find(socialLogins[i].user_id);
                        if (pos >= 0) {
                            userIds.splice(pos, 1);
                        }
                    }
                    return db.sequelize.transaction({autocommit: false});
                }
            ).then(
                transaction_ => {
                    transaction = transaction_;
                    return db.LocalLogin.destroy({where: {id: localLoginIds}, transaction});
                }
            ).then(
                count => {
                    return db.User.destroy({where: {id: userIds}, transaction});
                }
            ).then(
                count => {
                    amountDeleted = count;
                    return transaction.commit();
                }
            ).then(
                () => {
                    resolve(amountDeleted);
                }
            ).catch(
                err => {
                    if (transaction) {
                        transaction.rollback();
                    }
                    reject(err);
                }
            );
        }
    );
}

var activeInterval = 0;

function cycle() {
    if (TIMEOUT <= 0) {
        return;
    }

    deleteExpiredUsers().then(
        function (count) {
            console.log('[DELETE][Requested Deletions][amount', count, ']');
        },
        function (e) {
            console.log('[DELETE][Requested Deletions][error', e, ']');
        }
    );
    deleteVerificationFailUsers().then(
        function (count) {
            console.log('[DELETE][Verification Fail][amount', count, ']');
        },
        function (e) {
            console.log('[DELETE][Verification Fail][error', e, ']');
        }
    );

    activeInterval = setTimeout(
        cycle,
        TIMEOUT * 1000
    );
}

function start() {
    if (activeInterval) {
        return;
    }
    cycle();
}

function stop() {
    if (!activeInterval) {
        return;
    }
    clearTimeout(activeInterval);
    activeInterval = 0;
}