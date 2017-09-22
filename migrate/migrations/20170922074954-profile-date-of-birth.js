'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            queryInterface.removeColumn('UserProfiles', 'birthdate').then(
                function () {
                    return queryInterface.addColumn(
                        'UserProfiles',
                        "date_of_birth",
                        {"type": Sequelize.BIGINT}
                    );
                }
            ).then(resolve).catch(reject);
        });
    },

    down: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            queryInterface.removeColumn('UserProfiles', 'date_of_birth').then(
                function () {
                    return queryInterface.addColumn(
                        'UserProfiles',
                        "birthdate",
                        {"type": Sequelize.STRING(255)}
                    );
                }
            ).then(resolve).catch(reject);
        });
    }
};
