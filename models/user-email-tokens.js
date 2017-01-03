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
					notNull: true,
					notEmpty: true
				}
			},
			sub: DataTypes.STRING
		},
		{
			underscored: true,

			associate: function (models) {
				UserEmailToken.belongsTo(models.User);
				UserEmailToken.belongsTo(models.OAuth2Client);
			}
		});

	return UserEmailToken;
};
