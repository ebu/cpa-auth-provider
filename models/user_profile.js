"use strict";



module.exports = function(sequelize, DataTypes) {

    var UserProfile = sequelize.define('UserProfile', {

    firstName:DataTypes.STRING,
        lastName:DataTypes.STRING,
        mail:DataTypes.STRING,
        gender:DataTypes.STRING,
        date_of_birth:DataTypes.STRING, // FIXME: use date

}, {
        underscored: true,
            instanceMethods: {
        },
        associate: function(models) {
            UserProfile.hasOne(models.User);
        }
    });

    return UserProfile;
};