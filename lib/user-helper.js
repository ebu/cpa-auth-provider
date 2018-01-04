var config = require('../config');
var db = require('../models');
var passwordHelper = require('./password-helper');
var permissionName = require('./permission-name');
var codeHelper = require('./code-helper');
var emailHelper = require('./email-helper');
var xssFilters = require('xss-filters');
var logger = require('./logger');


var EXCEPTIONS = {
    EMAIL_TAKEN: 'EMAIL_TAKEN',
    PASSWORD_WEAK: 'PASSWORD_WEAK',
    MISSING_FIELDS: 'MISSING_FIELDS',
    UNKNOWN_GENDER: 'UNKNOWN_GENDER',
    MALFORMED_DATE_OF_BIRTH: 'MALFORMED_DATE_OF_BIRTH',
    INVALID_LAST_NAME: 'INVALID_LAST_NAME',
    INVALID_FIRST_NAME: 'INVALID_FIRST_NAME'
};

var requiredFields = {
    "gender": false,
    "date_of_birth": false,
    "firstname": false,
    "lastname": false,
    "language": false
};
var NAME_REGEX = /^[a-zA-Z\u00C0-\u017F -]*$/;

prepareConfig();

module.exports = {
    createLocalLogin: createLocalLogin,
    getRequiredFields: function () {
        return requiredFields;
    },
    reloadConfig: prepareConfig,
    updateProfile: updateProfile,
    getUsers: getUsers,
    countUsers: countUsers,
    getDisplayableUser: getDisplayableUser,
    NAME_REGEX: NAME_REGEX,
    EXCEPTIONS: EXCEPTIONS
};


function prepareConfig() {
    config.userProfiles = config.userProfiles || {};
    config.userProfiles.requiredFields = config.userProfiles.requiredFields || [];

    for (var key in requiredFields) {
        if (requiredFields.hasOwnProperty(key)) {
            requiredFields[key] = config.userProfiles.requiredFields.indexOf(key) >= 0;
        }
    }
}

function validateFiledsValues(attributes) {
    if (attributes.hasOwnProperty('gender')) {
        if (typeof(attributes.gender) !== 'string' || !attributes.gender.match(/(male|female|other)/)) {
            throw new Error(EXCEPTIONS.UNKNOWN_GENDER);
        }
    }

    if (attributes.hasOwnProperty('date_of_birth')) {
        if (typeof(attributes.date_of_birth) === 'string' && !attributes.date_of_birth.match(/\d*/)) {
            throw new Error(EXCEPTIONS.MALFORMED_DATE_OF_BIRTH);
        } else if (typeof(attributes.date_of_birth) !== 'string' && typeof(attributes.date_of_birth) !== 'number') {
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

    validateFiledsValues(attributes);
    return true;
}


/**
 * create a user including check for validity of some fields.
 * @return a promise.
 * @param email The email to be used for account creation.
 * @param password The password to be set.
 * @param requiredAttributes UserProfile attributes (i. e. language, gender, name)
 */
function createLocalLogin(email, password, requiredAttributes, optionnalAttributes) {
    return new Promise(
        function (resolve, reject) {
            var user;
            var localLogin;

            // userAttributes is a merge of requiredAttributes and optionnalAttributes
            var userAttributes = {};
            for (var a in requiredAttributes) {
                userAttributes[a] = requiredAttributes[a];
            }
            for (var oa in optionnalAttributes) {
                userAttributes[oa] = optionnalAttributes[oa];
            }

            db.LocalLogin.findOne({where: {login: email}}).then(
                function (localLogin) {
                    if (localLogin) {
                        throw new Error(EXCEPTIONS.EMAIL_TAKEN);
                    }
                    return db.User.findOne({where: {email: email}});
                }).then(
                function (u) {
                    user = u;
                    if (user) {
                        // User exist because it has been created by a social login
                        // Since Local login doesn't exist, that mean that the account is not validated
                        // So it's impossible to signup with that email
                        throw new Error(EXCEPTIONS.EMAIL_TAKEN);
                    }
                    return db.Permission.findOne({where: {label: permissionName.USER_PERMISSION}});
                }).then(
                function (permission) {
                    if (!passwordHelper.isStrong(email, password)) {
                        throw new Error(EXCEPTIONS.PASSWORD_WEAK);
                    }

                    validateFields(requiredAttributes);
                    validateFiledsValues(optionnalAttributes);

                    userAttributes.email = email;

                    if (permission) {
                        userAttributes.permission_id = permission.id;
                    }
                    return db.sequelize.transaction(function (transaction) {
                        // Code that have to run under a transaction:
                        return db.User.create(userAttributes, {transaction: transaction}).then(
                            function (u) {
                                user = u;
                                return db.LocalLogin.create({user_id: u.id, login: u.email}, {transaction: transaction});
                            }
                        ).then(
                            function (ll) {
                                localLogin = ll;
                                return localLogin.setPassword(password, transaction);
                            }
                        ).then(
                            function () {
                                return codeHelper.getOrGenereateEmailVerificationCode(user, transaction);
                            }
                        ).catch(
                            function (err) {
                                reject(err);
                            }
                        );
                    });
                }).then(
                function (code) {
                    // Don't need to be part of the transaction
                    localLogin.logLogin();
                    return emailHelper.send(
                        config.mail.from,
                        localLogin.login,
                        "validation-email",
                        {log: false},
                        {
                            confirmLink: config.mail.host + '/email_verify?email=' + encodeURIComponent(localLogin.email) + '&code=' + encodeURIComponent(code),
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
        });
}

function updateProfile(user, data) {
    return new Promise(
        function (resolve, reject) {
            var fields = ['firstname', 'lastname', 'gender', 'date_of_birth', 'language'];
            var attributes = {};
            fields.forEach(function (key) {
                if (data.hasOwnProperty(key)) {
                    //use XSS filters to prevent users storing malicious data/code that could be interpreted then
                    attributes[key] = xssFilters.inHTMLData(data[key]);
                } else if (requiredFields[key]) {
                    attributes[key] = user[key];
                }
            });

            validateFields(attributes);

            return user.updateAttributes(attributes)
                .then(
                    function () {
                        return user.updateAttributes({
                            display_name: user.firstname + ' ' + user.lastname
                        });
                    }
                ).then(
                    function () {
                        return resolve(user);
                    }
                ).catch(
                    reject
                );
        });
}

var DEFAULT_LIMIT = 20;
var MAX_LIMIT = 100;

function buildSearchOptions(req, adminId) {

    var options;

    // If an id is provided any other parameter are not taken into account.
    if (req.query.id) {
        options = {
            where: {id: req.query.id},
        };
        return options;
    }

    var offset = 0;
    if (req.query.offset) {
        offset = req.query.offset;
    }

    var include = [db.LocalLogin];


    var user_where = {$and: []};

    if (req.query.firstname) {
        user_where.$and.push(
            db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('firstname')),
                {
                    $like: '%' + req.query.firstname + '%'
                }));
    }
    if (req.query.lastname) {
        user_where.$and.push(
            db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('lastname')),
                {
                    $like: '%' + req.query.lastname + '%'
                }));
    }
    if (req.query.email) {
        user_where.$and.push(
            db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')),
                {
                    $like: '%' + req.query.email + '%'
                }));
    }

    // Admin search:
    if (req.query.admin) {
        include.push({model: db.Permission, where: {id: adminId}});
    }

    options = {
        offset: offset,
        where: user_where,
        order: ['email'],
        include: include
    };

    return options;
}

// This function is not used since I didn't find a way to use LOWER + LIKE on firstname, lastname and email column
function getUsers(req, adminId) {

    var options = buildSearchOptions(req, adminId);

    var limit = DEFAULT_LIMIT;
    if (req.query.limit) {
        if (req.query.limit <= MAX_LIMIT) {
            limit = req.query.limit;
        } else {
            limit = MAX_LIMIT;
        }
    }
    options.limit = limit;

    return db.User.findAll(options);
}

// This function is not used since I didn't find a way to use LOWER + LIKE on firstname, lastname and email column
function countUsers(req, adminId) {

    var options = buildSearchOptions(req, adminId);

    return db.User.count(options);
}

function getDisplayableUser(users) {
    var toReturn = [];
    var arrayLength = users.length;
    for (var i = 0; i < arrayLength; i++) {
        toReturn.push({
            id: users[i].id,
            email: users[i].email,
            permission_id: users[i].permission_id,
            created_at: users[i].LocalLogin ? users[i].LocalLogin.created_at : undefined,
            password_changed_at: users[i].LocalLogin ? users[i].LocalLogin.password_changed_at : undefined,
            last_login_at: users[i].LocalLogin ? users[i].LocalLogin.last_login_at : undefined,
            firstname: users[i].firstname ? users[i].firstname : '',
            lastname: users[i].lastname ? users[i].lastname : ''

        });
    }
    return toReturn;
}
