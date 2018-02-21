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
                    'OAuth2Clients',
                    'client_secret',
                    'jwt_code'
                ).then(
                    function () {
                        return queryInterface.addColumn(
                            'OAuth2Clients',
                            'client_secret',
                            Sequelize.STRING
                        );
                    }
                ).then(
                    resolve
                ).catch(
                    reject
                );
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
                    'OAuth2Clients',
                    'client_secret'
                ).then(
                    function () {
                        return queryInterface.renameColumn(
                            'OAuth2Clients',
                            'jwt_code',
                            'client_secret'
                        )
                    }
                ).then(
                    resolve
                ).catch(
                    reject
                );
            }
        );
    }
};
