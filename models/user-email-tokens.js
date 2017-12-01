"use strict";

module.exports = function (sequelize, DataTypes) {
    var UserEmailToken = sequelize.define(
        'UserEmailToken',
        {
            key: {
                type: DataTypes.STRING,
                primaryKey: true
            },
            type: {
                type: DataTypes.STRING,
                validate: {
                    notEmpty: true
                }
            },
            sub: DataTypes.STRING,
            redirect_uri: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            underscored: true,

            associate: function (models) {
                UserEmailToken.belongsTo(models.User);
                UserEmailToken.belongsTo(models.OAuth2Client, {foreignKey: 'oauth2_client_id', allowNull: true});
            }
        });

    UserEmailToken.prototype.consume = function () {
        return this.updateAttributes({sub: 'used'});
    };

    UserEmailToken.prototype.isAvailable = function () {
        return !this.sub;
    };

    return UserEmailToken;
};
