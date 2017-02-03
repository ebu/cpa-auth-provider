"use strict";

var config = require('../config');
var nodemailer = require('nodemailer');
var logger = require('./logger');

module.exports = {
	isReady: isReady,
	send: send
};

var ready = false;

var MAIL_OPTIONS = config.mail || {};
var OPTIONS = MAIL_OPTIONS.sending || {};

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

if (transporter) {
	transporter.verify().then(
		function () {
			logger.info('[EmailHelper][Transport init][type', OPTIONS.transport, '][DONE]');
			console.log('-----------------aaaaaa');
			ready = true;
		},
		function (err) {
			logger.error('[EmailHelper][Transport init][type', OPTIONS.transport, '][FAIL][err', err, ']');
			console.log('----------------bbbbb', err);
		}
	);
} else {
	logger.error('[EmailHelper][Transport init][FAIL][no transporter]');
	console.log('---------------cccccc');
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
 * Helper function for sending email.
 *
 * @param {String} from              The sender
 * @param {String} to                The recipients
 * @param {String} templateName      The mail template (in <project_dir>/templates/)
 * @param {Object} opts              Various option...
 * @param {Object} data              Data that will be injected in the body template
 * @param {Object} local             The template local
 * @param {Function} done            Callback function, invoked when the HTTP request
 *                                   has completed
 */
function send(from, to, templateName, opts, data, local, done) {
	if (opts.log) {
		console.log('from', from);
		console.log('to', to);
		console.log('templateName', templateName);
		console.log('opts', opts);
		console.log('data', data);
		console.log('local', local);
	}

	var EmailTemplate = require('email-templates').EmailTemplate;
	var path = require('path');

	var templateDir = path.join(__dirname, '..', 'templates', templateName);

	var newsletter = new EmailTemplate(templateDir);

	newsletter.render(data, local, function (err, result) {
		if (opts.log) {
			console.log('About to send the following mail with from:' + from + ", to " + to + " :\n" + result.html);
		}
		// TODO: Send the email
		doSend(from, to, result).then(
			function () {
			},
			function (err) {
				logger.error('[EmailHelper][SEND][err', err, ']');
			});
		done();
	})
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
					console.log('++++++++++++++++++EMAIL+++++++++++++');
					console.log(err);
					console.log(info);
					if (err) {
						return reject(err);
					}
					console.log(info);
					return resolve();
				}
			);
		}
	);
}
