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
                queryInterface.createTable(
                    "Permissions",
                    {
                        "id": {
                            "type": Sequelize.INTEGER,
                            "autoIncrement": true,
                            "primaryKey": true
                        },
                        "label": {
                            "type": Sequelize.STRING(255),
                            "unique": true
                        },
                        "created_at": {
                            "type": Sequelize.DATE,
                            "allowNull": false
                        },
                        "updated_at": {
                            "type": Sequelize.DATE,
                            "allowNull": false
                        }
                    }
                ).then(
                    function () {
                        return queryInterface.addColumn(
                            'Users',
                            'permission_id',
                            {
                                type: Sequelize.INTEGER,
                                onUpdate: "cascade",
                                "onDelete": "set null",
                                "references": {
                                    "model": "Permissions",
                                    "key": "id"
                                },
                                allowNull: true
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
                queryInterface.removeColumn(
                    'Users',
                    'permission_id'
                ).then(
                    function () {
                        return queryInterface.dropTable("Permissions");
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
