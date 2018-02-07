"use strict";


module.exports = function (sequelize, DataTypes) {
    var User = sequelize.define('User', {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        account_uid: {type: DataTypes.STRING/*, unique: true */},
        tracking_uid: DataTypes.STRING,
        enable_sso: DataTypes.BOOLEAN,
        display_name: DataTypes.STRING,
        photo_url: DataTypes.STRING,
        firstname: DataTypes.STRING,
        lastname: DataTypes.STRING,
        gender: DataTypes.STRING,
        date_of_birth: DataTypes.BIGINT,
        language: DataTypes.STRING,
        last_seen: DataTypes.BIGINT,
        scheduled_for_deletion_at: DataTypes.DATE,
    }, {
        underscored: true,

        associate: function (models) {
            User.hasMany(models.Client);
            User.hasMany(models.AccessToken);
            User.hasMany(models.ValidationCode);
            User.hasMany(models.SocialLogin);
            User.hasOne(models.LocalLogin);
            User.belongsTo(models.IdentityProvider);
            User.belongsTo(models.Permission);
        }
    });


    User.prototype.getDisplayName = function (policy, defaultDisplayName) {
        if (!policy) {
            return defaultDisplayName;
        }
        if (policy === "FIRSTNAME") {
            if (this.firstname) {
                return this.firstname;
            }
        }
        if (policy === "LASTNAME") {
            if (this.lastname) {
                return this.lastname;
            }
        }
        if (policy === "FIRSTNAME_LASTNAME") {
            if (this.firstname && this.lastname) {
                return this.firstname + ' ' + this.lastname;
            }
        }
        return defaultDisplayName;
    };

    User.prototype.logLastSeen = function (transaction) {
        return this.updateAttributes({last_seen: Date.now()}, {transaction: transaction});
    };

    return User;
};