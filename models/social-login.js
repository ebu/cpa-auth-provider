"use strict";


module.exports = function (sequelize, DataTypes) {

    var SocialLogin = sequelize.define('SocialLogin', {
        name: DataTypes.STRING,
        uid: DataTypes.STRING,
        firstname: DataTypes.STRING,
        lastname: DataTypes.STRING,
        gender: DataTypes.STRING,
        date_of_birth: DataTypes.BIGINT,
        language: DataTypes.STRING,
        last_login_at: DataTypes.BIGINT
    }, {
        underscored: true,
        associate: function (models) {
            SocialLogin.belongsTo(models.User);
        }
    });

    SocialLogin.prototype.logLogin = function (transaction) {
        var self = this;
        return self.updateAttributes({last_login_at: Date.now()}, {transaction: transaction});
    };

    return SocialLogin;
};