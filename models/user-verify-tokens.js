"use strict";

module.exports = function (sequelize, DataTypes) {
	var UserVerifyToken = sequelize.define(
		'UserVerifyTokens',
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
			}
		},
		{
			underscored: true,

			associate: function (models) {
				UserVerifyToken.belongsTo(models.User);
			}
		});

	return UserVerifyToken;
};
