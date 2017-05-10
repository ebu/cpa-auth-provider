"use strict";

var config = require('../config');
var nodemailer = require('nodemailer');
var logger = require('./logger');
var fs = require('fs');
var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');
var aws = require('aws-sdk');
var sesTransport = require('nodemailer-ses-transport');


module.exports = {
    isReady: isReady,
    send: send
};

var ready = false;

var MAIL_OPTIONS = config.mail || {};
var OPTIONS = MAIL_OPTIONS.sending || {};

/** name of the default folder to use for email templates */
var TEMPLATE_DEFAULT_PATH = MAIL_OPTIONS.defaultTemplateClass || 'default';

var transporter;
if (OPTIONS.transport == 'test') {
    transporter = nodemailer.createTransport({streamTransport: true});
} else if (OPTIONS.transport == 'direct') {
    transporter = nodemailer.createTransport({direct: true, name: OPTIONS.name});
} else if (OPTIONS.transport == 'sendmail') {
    transporter = nodemailer.createTransport({sendmail: true});
} else if (OPTIONS.transport == 'smtp') {
    transporter = nodemailer.createTransport(
        {
            host: OPTIONS.host,
            port: OPTIONS.port,
            secure: OPTIONS.secure,
            auth: {
                user: OPTIONS.username,
                pass: OPTIONS.password
            }
        }
    );
} else if (OPTIONS.transport == 'aws') {
    transporter = nodemailer.createTransport(sesTransport({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    }));
} else if (OPTIONS.transport == 'gmail') {
    transporter = nodemailer.createTransport(
        {
            service: 'gmail',
            auth: {
                user: OPTIONS.username,
                pass: OPTIONS.password
            }
        }
    );
}

if (OPTIONS.transport == 'aws') {
    logger.info('[EmailHelper][Transport init][type', OPTIONS.transport, '][SKIP for AWS]');
    ready = true;
} else {
    if (transporter) {

        transporter.verify().then(
            function () {
                logger.info('[EmailHelper][Transport init][type', OPTIONS.transport, '][DONE]');
                ready = true;
            },
            function (err) {
                logger.error('[EmailHelper][Transport init][type', OPTIONS.transport, '][FAIL][err', err, ']');
            }
        );
    } else {
        logger.error('[EmailHelper][Transport init][FAIL][no transporter]');
    }
}


/**
 * check if the email sending is ready.
 * as in: does it have a proper transport configured.
 * @return {boolean}
 */
function isReady() {
    return ready;
}

/**
 * Helper function for sending email. It returns a promise.
 *
 * @param {String} from              The sender
 * @param {String} to                The recipients
 * @param {String} templateName      The mail template (in <project_dir>/templates/:class:)
 * @param {Object} opts              Various option... e. g. templateClass to set something other than default for templates
 * @param {Object} data              Data that will be injected in the body template
 * @param {Object} local             The template local
 */
function send(from, to, templateName, opts, data, local) {
    return new Promise(
        function (resolve, reject) {
            if (opts.log) {
                console.log('from', from);
                console.log('to', to);
                console.log('templateName', templateName);
                console.log('opts', opts);
                console.log('data', data);
                console.log('local', local);
            }

            if (!local) {
                local = config.i18n.default_locale;
            }

            renderEmail(templateName, data, local, opts.templateClass).then(
                function (result) {
                    if (opts.log) {
                        console.log('About to send the following mail with from:' + from + ", to " + to + " :\n" + result.html);
                    }
                    if (OPTIONS.transport !== 'test') {
                        return doSend(from, to, result);
                    }
                }
            ).then(
                function () {
                    logger.info('[EmailHelper][doSend][email sent]');
                    return resolve(true);
                }
            ).catch(
                function (err) {
                    logger.error('[EmailHelper][SEND][err', err, ']');
                    return reject(err);
                }
            );
        }
    );
}

/**
 * render an email with the email templates
 * @param name Name of the template
 * @param data Data to be injected
 * @param locale The language to use
 * @param templateClass (optional) The specialized version of the template - e. g. for a specific client
 */
function renderEmail(name, data, locale, templateClass) {
    return new Promise(
        function (resolve, reject) {
            var templateDir = path.join(__dirname, '..', 'templates', TEMPLATE_DEFAULT_PATH, name);

            if (!templateClass) {
                return rendering(templateDir);
            }
            var checkDir = path.join(__dirname, '..', 'templates', templateClass, name);
            fs.stat(
                checkDir,
                function (err, stats) {
                    if (err) {
                        return rendering(templateDir);
                    }
                    if (stats.isDirectory()) {
                        return rendering(checkDir);
                    } else {
                        return rendering(templateDir);
                    }
                }
            );

            function rendering(dir) {
                var template = new EmailTemplate(dir);

                template.render(data, locale, function (err, result) {
                    if (err) {
                        return reject(err);
                    } else {
                        return resolve(result);
                    }
                });
            }
        }
    );
}

function doSend(from, to, mail) {
    return new Promise(
        function (resolve, reject) {
            transporter.sendMail(
                {
                    from: from,
                    to: to,
                    subject: mail.subject,
                    text: mail.text,
                    html: mail.html,
                },
                function (err, info) {
                    if (err) {
                        logger.error('[EmailHelper][doSend][FAIL][err', err, ']');
                        return reject(err);
                    }
                    logger.info('[EmailHelper][doSend][info', info, ']');
                    return resolve();
                }
            );
        }
    );
}
