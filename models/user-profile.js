"use strict";


module.exports = function (sequelize, DataTypes) {

    var UserProfile = sequelize.define('UserProfile', {
        firstname: DataTypes.STRING,
        lastname: DataTypes.STRING,
        gender: DataTypes.STRING,
        birthdate: DataTypes.DATE

    }, {
        underscored: true,
        instanceMethods: {},
        associate: function (models) {
            UserProfile.belongsTo(models.User);
        }
    });

    return UserProfile;
};