'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            // Add new columns to table Users
            return queryInterface.addColumn(
                "OAuth2Client",
                "use_template",
                {
                    type: Sequelize.STRING,
                    allowNull: true
                }
            ).then(resolve).catch(reject);
        });
    },

    down: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    }
}
