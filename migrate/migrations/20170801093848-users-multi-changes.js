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
                queryInterface.removeColumn(
                    'Users',
                    'admin'
                ).then(
                    function () {
                        return queryInterface.addColumn('Users', 'password_changed_at', Sequelize.BIGINT);
                    }
                ).then(
                    function () {
                        return queryInterface.addColumn('Users', 'last_login_at', Sequelize.BIGINT);
                    }
                ).then(
                    function () {
                        return queryInterface.changeColumn(
                            'Users',
                            'email',
                            {
                                type: Sequelize.STRING(255),
                                unique: true
                            }
                        );
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
                queryInterface.addColumn(
                    'Users',
                    'admin',
                    Sequelize.BOOLEAN
                ).then(
                    function () {
                        return queryInterface.removeColumn('Users', 'password_changed_at');
                    }
                ).then(
                    function () {
                        return queryInterface.removeColumn('Users', 'last_login_at');
                    }
                ).then(
                    function () {
                        return queryInterface.changeColumn('Users', 'email', {type: Sequelize.STRING(255)});
                    }
                ).then(
                    function () {
                        return new Promise(
                            function (resolve, reject) {
                                queryInterface.sequelize.query(
                                    'ALTER TABLE "Users" DROP CONSTRAINT "email_unique_idx";'
                                ).then(
                                    resolve
                                ).catch(
                                    resolve
                                );
                            }
                        );
                    }
                ).then(
                    function () {
                        return new Promise(
                            function (resolve, reject) {
                                queryInterface.removeIndex('Users', 'email_unique_idx').then(
                                    resolve, resolve
                                );
                            }
                        );
                    }
                ).then(
                    resolve
                ).catch(
                    reject
                )
            }
        );
    }
};
