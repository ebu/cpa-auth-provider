"use strict";
var db = require('../models');
var config = require('../config');
var emailHelper = require('./email-helper');
const logger = require('./logger');

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
var VERIFICATION_TIME = DELETION_CONF.verification_time === undefined ? 48 * 60 * 60 : DELETION_CONF.verification_time;

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
                    let localLogin = user.LocalLogin;
                    var emailSent = localLogin && localLogin.verified;
                    if (emailSent) {
                        var link = client ? client.email_redirect_uri : '';
                        link = link || config.mail.host;
                        let email = localLogin.login;

                        emailHelper.send(
                            config.mail.from,
                            email,
                            "delete-notification",
                            {log: false},
                            {
                                link: link,
                                host: config.mail.host,
                                mail: email,
                            },
                            user.language || config.mail.local
                        ).then(
                            function () {
                            },
                            function (e) {
                                logger.error(e);
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
                    let localLogin = user.LocalLogin;
                    var emailSent = localLogin && localLogin.verified;
                    if (emailSent) {
                        var link = client ? client.email_redirect_uri : '';
                        link = link || config.mail.host;
                        let email = localLogin.login;
                        emailHelper.send(
                            config.mail.from,
                            email,
                            "delete-cancelled-notification",
                            {log: false},
                            {
                                link: link,
                                host: config.mail.host,
                                mail: email,
                            },
                            user.language || config.mail.local
                        ).then(
                            function () {
                            },
                            function (e) {
                                logger.error(e);
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
            if (VERIFICATION_TIME <= 0) {
                return resolve();
            }
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
            logger.info('[DELETE][Requested Deletions][amount', count, ']');
        },
        function (e) {
            logger.error('[DELETE][Requested Deletions][error', e, ']');
        }
    );
    deleteVerificationFailUsers().then(
        function (count) {
            logger.info('[DELETE][Verification Fail][amount', count, ']');
        },
        function (e) {
            logger.error('[DELETE][Verification Fail][error', e, ']');
        }
    );

    activeInterval = setTimeout(
        cycle,
        TIMEOUT * 1000
    );
}

function start() {
    // Be aware that by changing the following code you might delete all none validated account in production
    if (config.deletion && config.deletion.automatic_deletion_activated) {
        if (activeInterval) {
            return;
        }
        cycle();
    }
}

function stop() {
    if (!activeInterval) {
        return;
    }
    clearTimeout(activeInterval);
    activeInterval = 0;
}