/* globals module,require */
"use strict";

module.exports = {
	getQuality: getQuality,
	getMessage: getMessage
};

var ERRORS = {
	NO_ERROR: '',
	INTERNAL: 'internal',
	TOO_SHORT: 'too-short',
};

var MIN_PASSWORD_LENGTH = 4;

function getQuality(password) {
	if (typeof password !== 'string') {
		return { value: 0, error: ERRORS.INTERNAL };
	}
	if (password.length < MIN_PASSWORD_LENGTH) {
		return { value: 0, error: ERRORS.TOO_SHORT };
	}

	return {value: 1, error: ERRORS.NO_ERROR}
}

/** get message, potentially with a locale */
function getMessage(error) {
	if (!error || error === ERRORS.NO_ERROR) {
		return '';
	}

	if (error === ERRORS.TOO_SHORT) {
		return 'Passwort zu kurz. Es muss mindestens '+ MIN_PASSWORD_LENGTH + ' Zeichen lang sein.';
	}

	return 'Passwort ungültig.'; // internal error
}