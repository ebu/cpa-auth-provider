'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        /*
          Add altering commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.createTable('users', { id: Sequelize.INTEGER });
        */
        return queryInterface.createTable(
            "Domains",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true
                },
                "name": {
                    "type": Sequelize.STRING(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "display_name": {
                    "type": Sequelize.STRING(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "access_token": {
                    "type": Sequelize.STRING(255),
                    "validate": {
                        "notEmpty": true
                    }
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
        );
    },

    down: function (queryInterface, Sequelize) {
        /*
          Add reverting commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.dropTable('users');
        */
        return queryInterface.dropTable(
            'Domains'
        );
    }
};
