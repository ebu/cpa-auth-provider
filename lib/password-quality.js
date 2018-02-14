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
	TOO_SIMPLE: 'too-simple',
};

var MIN_PASSWORD_LENGTH = 4;

var qualities = [
	{ pattern: /[0-9]/, value: 10 }, // 0-9
	{ pattern: /[a-z]/, value: 26 }, // a-z
	{ pattern: /[A-Z]/, value: 26 }, // A-Z
	{ pattern: /[\W]/, value: 32 } // ,.<>+_!@#$%^&*()_+{}[]"|'\/?`~
];

const QUALITY = {
	min: 23,
	scale: 50,
};

function getBase(password) {
	var base = 0;
	for (var i = 0; i < qualities.length; ++i) {
		if( qualities[i].pattern.test(password) ) {
			base += qualities[i].value;
		}
	}
	return base;
}

function getQuality(password) {
	if (typeof password !== 'string') {
		return { value: 0, error: ERRORS.INTERNAL };
	}
	if (password.length < MIN_PASSWORD_LENGTH) {
		return { value: 0, error: ERRORS.TOO_SHORT };
	}

	var base = Math.log(getBase(password));
	var len = password.length;

	var quality = len * base;

	var value = Math.max(0, Math.min((quality - QUALITY.min) / QUALITY.scale, 1));

	if (value <= 0) {
		return { value: 0, error: ERRORS.TOO_SIMPLE };
	}

	return {value: value, error: ERRORS.NO_ERROR};
}

/** get message, potentially with a locale */
function getMessage(error, req) {
	if (!error || error === ERRORS.NO_ERROR) {
		return '';
	}

	if (error === ERRORS.TOO_SHORT) {
        return req.__mf('BACK_SIGNUP_PASS_SIMPLE_TOO_SHORT', {length: MIN_PASSWORD_LENGTH});
	}

	if (error === ERRORS.TOO_SIMPLE) {
	    return req.__('BACK_SIGNUP_PASS_SIMPLE_TOO_SIMPLE');
	}

	return req.__('BACK_SIGNUP_PASS_SIMPLE_TOO_GENERIC_FAIL'); // internal error
}