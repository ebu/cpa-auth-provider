"use strict";

var fs = require('fs');

exports.sendConfirmEmail = sendConfirmEmail;

var BASE_PATH = 'views/emails/';
var DEFAULT_PATH = BASE_PATH + 'default';

var FROM_ADDRESS = 'daniel.krax@br.de';

var TYPES = {
	CONFIRM: {filename: 'confirm.html'},
	PASSWORD_RESET: {filename: 'pwreset.html'}
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
	if (!ses) {
		var aws = require('aws-sdk');

		aws_ses = aws.SES();
	}
	return aws_ses;
}

function sendConfirmEmail(recipient, confirmLink, deleteLink, client) {
	return new Promise(function (resolve, reject) {
		getEmail(TYPES.CONFIRM, client).then(
			function (content) {
				var emailContent = content.replace('{{USERNAME}}', recipient)
					.replace('{{CONFIRMLINK}}', confirmLink)
					.replace('{{DELETELINK}}', deleteLink);

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
								Data: emailContent,
								Charset: 'utf8'
							}
						}
					},
					function (err, data) {
						if (err) {
							return reject(err);
						} else {
							return resolve(data);
						}
					}
				);
			}
		).catch(reject)
	});
}