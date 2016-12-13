"use strict";

module.exports = function (sequelize, DataTypes) {
	var UserVerifyToken = sequelize.define(
		'UserVerifyToken',
		{
			key: {
				type: DataTypes.STRING,
				primaryKey: true
			},
			type: {
				type: DataTypes.STRING,
				validate: {
					notNull: true,
					notEmpty: true
				}
			},
			sub: DataTypes.STRING
		},
		{
			underscored: true,

			associate: function (models) {
				UserVerifyToken.belongsTo(models.User);
				UserVerifyToken.belongsTo(models.OAuth2Client);
			}
		});

	return UserVerifyToken;
};
