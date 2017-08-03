'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        /*
          Add altering commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.createTable('users', { id: Sequelize.INTEGER });
        */
        var PERMISSIONS = [
            {
                id: 1,
                label: "admin"
            },
            {
                id: 2,
                label: "other"
            }
        ];


        return new Promise(
            function (resolve, reject) {
                queryInterface.renameColumn(
                    'Users',
                    'email_verified',
                    'verified'
                ).then(resolve, reject);
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
                queryInterface.renameColumn(
                    'Users',
                    'verified',
                    'email_verified'
                ).then(
                    resolve
                ).catch(
                    reject
                )
            }
        );
    }
};
