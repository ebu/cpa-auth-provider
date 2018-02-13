"use strict";

var bcrypt = require('bcrypt');
var legacyPasswordHelper = require('../lib/legacy-password-helper');

// mark password hashes as bcrypt password
var BCRYPT_TAG = '{BC}';
var PASSWORD_REGEX = /(\{\w+})?(.*)/;

module.exports = function (sequelize, DataTypes) {

    var LocalLogin = sequelize.define('LocalLogin', {
        login: {type: DataTypes.STRING, unique: true},
        password: DataTypes.STRING,
        verified: DataTypes.BOOLEAN,
        password_changed_at: DataTypes.BIGINT,
        last_login_at: DataTypes.BIGINT,
    }, {
        underscored: true,
        associate: function (models) {
            LocalLogin.belongsTo(models.User, {onDelete: 'cascade'});
        }
    });


    LocalLogin.prototype.logLogin = function (user, transaction) {
        var self = this;
        return self.updateAttributes({last_login_at: Date.now()}, {transaction: transaction}).then(function () {
            return user.logLastSeen();
        });
    };
    LocalLogin.prototype.setPassword = function (password, transaction) {
        var self = this;
        return new Promise(
            function (resolve, reject) {
                bcrypt.hash(password, 10).then(
                    function (hash) {
                        return self.updateAttributes(
                            {password: BCRYPT_TAG + hash, password_changed_at: Date.now()},
                            {transaction: transaction}
                        );
                    }
                ).then(
                    resolve
                ).catch(reject);
            }
        );
    };
    LocalLogin.prototype.verifyPassword = function (password) {
        var result = PASSWORD_REGEX.exec(this.password);
        var hash = result[2];
        var func = legacyPasswordHelper.getCheckFunction(result[1]);
        if (func) {
            return func(password, hash, this.password);
        } else {
            return bcrypt.compare(password, hash);
        }
    };

    return LocalLogin;
};