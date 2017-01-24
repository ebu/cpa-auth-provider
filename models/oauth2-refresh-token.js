"use strict";

module.exports = function (sequelize, DataTypes) {
	var OAuth2RefreshToken = sequelize.define(
		'OAuth2RefreshToken',
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			key: {
				type: DataTypes.STRING,
				validate: {
					notEmpty: true
				}
			},
			expires_at: {
				type: DataTypes.DATE,
				validate: {
					notEmpty: true
				}
			},
			scope: DataTypes.STRING,
			consumed: DataTypes.BOOLEAN
		},
		{
			underscored: true,
			indexes: [
				{ unique: true, fields: ['key'] }
			],
			associate: function(models) {
				OAuth2RefreshToken.belongsTo(models.User);
				OAuth2RefreshToken.belongsTo(models.OAuth2Client, {foreignKey: 'oauth2_client_id'});
			}
		}
	);
	return OAuth2RefreshToken;
};
