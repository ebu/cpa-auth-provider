'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        /*
          Add altering commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.createTable('users', { id: Sequelize.INTEGER });
        */
        function mysqlInsert() {
            return new Promise(
                function (resolve, reject) {
                    queryInterface.sequelize.query(
                        'INSERT INTO Permissions (id,label,created_at,updated_at) VALUES (1, \'admin\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);'
                    ).then(
                        function () {
                            return queryInterface.sequelize.query(
                                'INSERT INTO Permissions (id,label,created_at,updated_at) VALUES (2, \'other\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);');
                        }
                    ).then(
                        resolve
                    ).catch(
                        reject
                    );
                }
            );
        }

        function postgresInsert() {
            return new Promise(
                function (resolve, reject) {
                    queryInterface.sequelize.query(
                        'INSERT INTO "Permissions" (id,label,created_at,updated_at) VALUES (1, \'admin\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);'
                    ).then(
                        function () {
                            return queryInterface.sequelize.query(
                                'INSERT INTO "Permissions" (id,label,created_at,updated_at) VALUES (2, \'other\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);');
                        }
                    ).then(
                        resolve
                    ).catch(
                        reject
                    );
                }
            );
        }

        return new Promise(
            function (resolve, reject) {
                mysqlInsert().then(
                    resolve,
                    function () {
                        postgresInsert().then(
                            resolve,
                            reject
                        );
                    }
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
                resolve();
            }
        );
    }
};
