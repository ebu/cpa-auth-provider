"use strict";

var fs = require('fs');
var config = require('../config');
var logger = require('./logger');

module.exports = {
    sendConfirmEmail: sendConfirmEmail,
    sendConfirmAndPasswordEmail: sendConfirmAndForcePasswordEmail,
    sendDeleteNotification: sendDeleteNotification,
    sendForcePasswordEmail: sendForcePasswordEmail,
};

var BASE_PATH = 'views/emails/';
var DEFAULT_PATH = BASE_PATH + 'default';

var FROM_ADDRESS = config.email_from || config.mail.from;

var TYPES = {
    CONFIRM: {filename: 'confirm.html'},
    DELETE_NOTE: {filename: 'delete-note.html'},
    PASSWORD_FORCE: {filename: 'force-password.html'},
    CONFIRM_AND_FORCE: {filename: 'confirm-and-password.html'}
};

var emailData = {};


function getEmail(type, client) {
    return new Promise(
        function (resolve, reject) {
            if (client && emailData.hasOwnProperty(client)) {
                return resolve(emailData[client]);
            }

            var file_path = BASE_PATH + client;
            if (!client || !fs.statSync(file_path).isDirectory()) {
                file_path = DEFAULT_PATH;
            }

            var email_file = file_path + '/' + type.filename;

            fs.readFile(
                email_file,
                'utf8',
                function (err, data) {
                    if (err) {
                        return reject(err);
                    }
                    emailData[client] = data;
                    return resolve(data);
                }
            );

        }
    );
}

var aws_ses = undefined;

function getSes() {
    if (!aws_ses) {
        var aws = require('aws-sdk');

        aws_ses = new aws.SES({region: process.env.AWS_REGION});
    }
    return aws_ses;
}

function fakeSend(content) {
    console.log('--------SENDING---------');
    console.log(content);
    console.log('------------------------');
}

function sendConfirmEmail(recipient, confirmLink, deleteLink, client) {
    return new Promise(function (resolve, reject) {
        getEmail(TYPES.CONFIRM, client).then(
            function (content) {
                var emailContent = content.replace(/\{\{USERNAME}}/g, recipient)
                    .replace(/\{\{CONFIRMLINK}}/g, confirmLink)
                    .replace(/\{\{DELETELINK}}/g, deleteLink);

                if (config.mail && config.mail.test_mode) {
                    fakeSend(emailContent);
                    return resolve();
                }

                var ses = getSes();
                if (!ses) {
                    return reject();
                }


                ses.sendEmail(
                    {
                        Source: FROM_ADDRESS,
                        Destination: {ToAddresses: [recipient]},
                        Message: {
                            Subject: {
                                Data: 'BR Mediathek Registrierung',
                                Charset: 'utf8'
                            },
                            Body: {
                                Html: {
                                    Data: emailContent,
                                    Charset: 'utf8'
                                }
                            }
                        }
                    },
                    function (err, data) {
                        if (err) {
                            console.log('[Email Sending][Confirm][FAIL][TO', recipient, '][FROM', FROM_ADDRESS, ']', err);
                            if (config.mail && config.mail.test_mode) {
                                return resolve(data);
                            }
                            return reject(err);
                        } else {
                            console.log('[Email Sending][Confirm][SUCCESS][TO', recipient, '][FROM', FROM_ADDRESS, ']');
                            return resolve(data);
                        }
                    }
                );
            }
        ).catch(reject)
    });
}

function sendForcePasswordEmail(recipient, forceLink, client) {
    return new Promise(function (resolve, reject) {
        getEmail(TYPES.PASSWORD_FORCE, client).then(
            function (content) {
                var emailContent = content.replace(/\{\{USERNAME}}/g, recipient)
                    .replace(/\{\{FORCELINK}}/g, forceLink);

                if (config.mail && config.mail.test_mode) {
                    fakeSend(emailContent);
                    return resolve();
                }

                var ses = getSes();
                if (!ses) {
                    return reject();
                }


                ses.sendEmail(
                    {
                        Source: FROM_ADDRESS,
                        Destination: {ToAddresses: [recipient]},
                        Message: {
                            Subject: {
                                Data: 'BR Mediathek Passwort setzen',
                                Charset: 'utf8'
                            },
                            Body: {
                                Html: {
                                    Data: emailContent,
                                    Charset: 'utf8'
                                }
                            }
                        }
                    },
                    function (err, data) {
                        if (err) {
                            logger.debug('[Email Sending][Password Force][FAIL][TO', recipient, '][FROM', FROM_ADDRESS, ']', err);
                            return reject(err);
                        } else {
                            logger.debug('[Email Sending][Password Force][SUCCESS][TO', recipient, '][FROM', FROM_ADDRESS, ']');
                            return resolve(data);
                        }
                    }
                );
            }
        ).catch(reject)
    });
}

function sendConfirmAndForcePasswordEmail(recipient, forceLink, client) {
    return new Promise(function (resolve, reject) {
        getEmail(TYPES.CONFIRM_AND_FORCE, client).then(
            function (content) {
                var emailContent = content.replace(/\{\{USERNAME}}/g, recipient)
                    .replace(/\{\{FORCELINK}}/g, forceLink);

                if (config.mail && config.mail.test_mode) {
                    fakeSend(emailContent);
                    return resolve();
                }

                var ses = getSes();
                if (!ses) {
                    return reject();
                }


                ses.sendEmail(
                    {
                        Source: FROM_ADDRESS,
                        Destination: {ToAddresses: [recipient]},
                        Message: {
                            Subject: {
                                Data: 'BR Mediathek Passwort setzen',
                                Charset: 'utf8'
                            },
                            Body: {
                                Html: {
                                    Data: emailContent,
                                    Charset: 'utf8'
                                }
                            }
                        }
                    },
                    function (err, data) {
                        if (err) {
                            logger.debug('[Email Sending][Password Force][FAIL][TO', recipient, '][FROM', FROM_ADDRESS, ']', err);
                            return reject(err);
                        } else {
                            logger.debug('[Email Sending][Password Force][SUCCESS][TO', recipient, '][FROM', FROM_ADDRESS, ']');
                            return resolve(data);
                        }
                    }
                );
            }
        ).catch(reject)
    });
}

function sendDeleteNotification(recipient, undoLink, client) {
    return new Promise(function (resolve, reject) {
        getEmail(TYPES.DELETE_NOTE, client).then(
            function (content) {
                console.log('sendDeleteNotification', recipient, ',', undoLink);
                var emailContent = content.replace(/\{\{USEREMAIL}}/g, recipient)
                    .replace(/\{\{LINK}}/g, undoLink);

                if (config.mail && config.mail.test_mode) {
                    fakeSend(emailContent);
                    return resolve();
                }

                var ses = getSes();
                if (!ses) {
                    return reject();
                }


                ses.sendEmail(
                    {
                        Source: FROM_ADDRESS,
                        Destination: {ToAddresses: [recipient]},
                        Message: {
                            Subject: {
                                Data: 'BR Mediathek Account löschen',
                                Charset: 'utf8'
                            },
                            Body: {
                                Html: {
                                    Data: emailContent,
                                    Charset: 'utf8'
                                }
                            }
                        }
                    },
                    function (err, data) {
                        if (err) {
                            logger.debug('[Email Sending][Delete Notification][FAIL][TO', recipient, '][FROM', FROM_ADDRESS, ']', err);
                            return reject(err);
                        } else {
                            logger.debug('[Email Sending][Delete Notification][SUCCESS][TO', recipient, '][FROM', FROM_ADDRESS, ']');
                            return resolve(data);
                        }
                    }
                );
            }
        ).catch(reject)
    });
}
