"use strict";


module.exports = function (sequelize, DataTypes) {

    var OAuthProvider = sequelize.define('OAuthProvider', {
        name: DataTypes.STRING,
        uid: DataTypes.STRING

    }, {
        underscored: true,
        associate: function (models) {
            OAuthProvider.belongsTo(models.User);
        }
    });

    return OAuthProvider;
};