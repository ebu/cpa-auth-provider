"use strict";


module.exports = function (sequelize, DataTypes) {

    var OAuthProvider = sequelize.define('OAuthProvider', {
        name: DataTypes.STRING,
        uid: DataTypes.STRING,
        firstname: DataTypes.STRING,
        lastname: DataTypes.STRING,
        gender: DataTypes.STRING,
        date_of_birth: DataTypes.BIGINT,
        language: DataTypes.STRING

    }, {
        underscored: true,
        associate: function (models) {
            OAuthProvider.belongsTo(models.User);
        }
    });

    return OAuthProvider;
};