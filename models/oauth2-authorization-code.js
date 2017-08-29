"use strict";

var config = require('../config');
var expiresMixin = require('../lib/expires-mixin');

module.exports = function (sequelize, DataTypes) {

    var OAuth2AuthorizationCode = sequelize.define('OAuth2AuthorizationCode', {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        authorization_code: DataTypes.STRING,
        redirect_uri: DataTypes.STRING,
        state: DataTypes.STRING
    }, {
        underscored: true,

        associate: function (models) {
            OAuth2AuthorizationCode.belongsTo(models.OAuth2Client, {foreignKey: 'oauth2_client_id'});
            OAuth2AuthorizationCode.belongsTo(models.User);
        }
    });

    return OAuth2AuthorizationCode;
};
