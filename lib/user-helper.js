var config = require('../config');
var db = require('../models');
var passwordHelper = require('./password-helper');
var permissionName = require('./permission-name');
var codeHelper = require('./code-helper');
var emailHelper = require('./email-helper');
var xssFilters = require('xss-filters');

var EXCEPTIONS = {
    EMAIL_TAKEN: 'EMAIL_TAKEN',
    PASSWORD_WEAK: 'PASSWORD_WEAK',
    MISSING_FIELDS: 'MISSING_FIELDS',
    UNKNOWN_GENDER: 'UNKNOWN_GENDER',
    MALFORMED_DATE_OF_BIRTH: 'MALFORMED_DATE_OF_BIRTH',
    INVALID_LAST_NAME: 'INVALID_LAST_NAME',
    INVALID_FIRST_NAME: 'INVALID_FIRST_NAME'
};

var requiredFields = {"gender": false, "birthdate": false, "firstname": false, "lastname": false, "language": false};
var NAME_REGEX = /^[a-zA-Z\u00C0-\u017F -]*$/;

prepareConfig();

module.exports = {
    createUser: createUser,
    getRequiredFields: function () {
        return requiredFields;
    },
    reloadConfig: prepareConfig,
    updateProfile: updateProfile,
    NAME_REGEX: NAME_REGEX,
    EXCEPTIONS: EXCEPTIONS
};


function prepareConfig() {
    config.userProfiles = config.userProfiles || {};
    config.userProfiles.requiredFields = config.userProfiles.requiredFields || [];

    for (var i = 0; i < config.userProfiles.requiredFields.length; ++i) {
        config.userProfiles.requiredFields[i] = config.userProfiles.requiredFields[i].toLowerCase().trim();
        if (requiredFields.hasOwnProperty(config.userProfiles.requiredFields[i])) {
            requiredFields[config.userProfiles.requiredFields[i]] = true;
        }
    }
}

function validateFields(attributes) {
    var missingFields = [];
    config.userProfiles.requiredFields.forEach(
        function (element) {
            if (!attributes.hasOwnProperty(element) || !attributes[element]) {
                missingFields.push(element);
            }
        }
    );
    if (missingFields.length > 0) {
        var err = new Error(EXCEPTIONS.MISSING_FIELDS, missingFields);
        err.data = {missingFields: missingFields};
        throw err;
    }

    if (attributes.hasOwnProperty('gender')) {
        if (typeof(attributes.gender) !== 'string' || !attributes.gender.match(/(male|female|other)/)) {
            throw new Error(EXCEPTIONS.UNKNOWN_GENDER);
        }
    }

    if (attributes.hasOwnProperty('birthdate')) {
        if (typeof(attributes.birthdate) === 'string' && !attributes.birthdate.match(/\d*/)) {
            throw new Error(EXCEPTIONS.MALFORMED_DATE_OF_BIRTH);
        } else if (typeof(attributes.birthdate) !== 'string' && typeof(attributes.birthdate) !== 'number') {
            throw new Error(EXCEPTIONS.MALFORMED_DATE_OF_BIRTH);
        }
    }

    if (attributes.hasOwnProperty('lastname')) {
        if (typeof(attributes.lastname) !== 'string' || !attributes.lastname.match(NAME_REGEX)) {
            throw new Error(EXCEPTIONS.INVALID_LAST_NAME);
        }
    }
    if (attributes.hasOwnProperty('firstname')) {
        if (typeof(attributes.firstname) !== 'string' || !attributes.firstname.match(NAME_REGEX)) {
            throw new Error(EXCEPTIONS.INVALID_FIRST_NAME);
        }
    }
    return true;
}


/**
 * create a user including check for validity of some fields.
 * @return a promise.
 * @param email The email to be used for account creation.
 * @param password The password to be set.
 * @param attributes UserProfile attributes (i. e. language, gender, name)
 */
function createUser(email, password, attributes) {
    return new Promise(
        function (resolve, reject) {
            var user;
            db.User.findOne({where: {email: email}}).then(
                function (u) {
                    if (u) {
                        throw new Error(EXCEPTIONS.EMAIL_TAKEN);
                    }

                    return db.Permission.findOne({where: {label: permissionName.USER_PERMISSION}});
                }
            ).then(
                function (permission) {
                    if (!passwordHelper.isStrong(password)) {
                        throw new Error(EXCEPTIONS.PASSWORD_WEAK);
                    }

                    validateFields(attributes);

                    var userParams = {
                        email: email
                    };
                    if (permission) {
                        userParams.permission_id = permission.id;
                    }
                    return db.User.create(userParams);
                }
            ).then(
                function (u) {
                    user = u;
                    return user.setPassword(password);
                }
            ).then(
                function () {
                    return db.UserProfile.findOrCreate(
                        {
                            where: {user_id: user.id},
                            defaults: attributes
                        }
                    );
                }
            ).spread(
                function () {
                    return codeHelper.getOrGenereateEmailVerificationCode(user);
                }
            ).then(
                function (code) {
                    user.logLogin();
                    return emailHelper.send(
                        config.mail.from,
                        user.email,
                        "validation-email",
                        {log: false},
                        {
                            confirmLink: config.mail.host + '/email_verify?email=' + encodeURIComponent(user.email) + '&code=' + encodeURIComponent(code),
                            host: config.mail.host,
                            mail: encodeURIComponent(user.email),
                            code: encodeURIComponent(code)
                        },
                        user.language || config.mail.local
                    );
                }
            ).then(
                function () {
                    resolve(user);
                }
            ).catch(
                function (err) {
                    reject(err);
                }
            );
        }
    );
}

function updateProfile(user, data) {
    return new Promise(
        function (resolve, reject) {


            var userProfile;

            db.UserProfile.findOrCreate({where: {user_id: user.id}}).spread(
                function (profile) {
                    userProfile = profile;
                    var fields = ['firstname', 'lastname', 'gender', 'birthdate', 'language'];
                    var attributes = {};
                    fields.forEach(function (key) {
                        if (data.hasOwnProperty(key)) {
                            //use XSS filters to prevent users storing malicious data/code that could be interpreted then
                            attributes[key] = xssFilters.inHTMLData(data[key]);
                        } else if (requiredFields[key]) {
                            attributes[key] = userProfile[key];
                        }
                    });

                    validateFields(attributes);

                    return userProfile.updateAttributes(attributes);
                }
            ).then(
                function (profile) {
                    return user.updateAttributes({
                        display_name: profile.firstname + ' ' + profile.lastname
                    });
                }
            ).then(
                function () {
                    return resolve(userProfile);
                }
            ).catch(
                reject
            );
        }
    );
}
