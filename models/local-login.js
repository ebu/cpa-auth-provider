"use strict";


module.exports = function (sequelize, DataTypes) {

    var LocalLogin = sequelize.define('LocalLogin', {
        email: {type: DataTypes.STRING, unique: true},
        password: DataTypes.STRING,
        verified: DataTypes.BOOLEAN,
        password_changed_at: DataTypes.BIGINT,
        last_login_at: DataTypes.BIGINT,
    }, {
        underscored: true,
        associate: function (models) {
            LocalLogin.belongsTo(models.User);
        }
    });

    return LocalLogin;
};