'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        /*
          Add altering commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.createTable('users', { id: Sequelize.INTEGER });
        */
        return new Promise(
            function (resolve, reject) {
                queryInterface.addColumn(
                    "UserProfiles",
                    "language",
                    {
                        type: Sequelize.STRING(255)
                    }
                ).then(
                    resolve
                ).catch(
                    reject
                )
            }
        );
    },

    down: function (queryInterface, Sequelize) {
        /*
          Add reverting commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.dropTable('users');
        */
        return new Promise(
            function (resolve, reject) {
                queryInterface.removeColumn(
                    "UserProfiles", "language"
                ).then(
                    resolve
                ).catch(
                    reject
                )
            }
        );
    }
};
