"use strict";


module.exports = function (sequelize, DataTypes) {

    var UserProfile = sequelize.define('UserProfile', {
        firstname: DataTypes.STRING,
        lastname: DataTypes.STRING,
        gender: DataTypes.STRING,
        birthdate: DataTypes.STRING,
        language: DataTypes.STRING

    }, {
        underscored: true,
        associate: function (models) {
            UserProfile.belongsTo(models.User);
        }
    });

    UserProfile.prototype.getDisplayName = function (user, policy) {
        if (!policy) {
            return user.email;
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
        return user.email;
    };

    return UserProfile;
};