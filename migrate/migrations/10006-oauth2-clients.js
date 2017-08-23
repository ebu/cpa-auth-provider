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
            "OAuth2Clients",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true
                },
                "client_id": {
                    "type": Sequelize.STRING(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "client_secret": {
                    "type": Sequelize.STRING(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "name": {
                    "type": Sequelize.STRING(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "redirect_uri": {
                    "type": Sequelize.STRING(255),
                    "allowNull": true
                },
                "email_redirect_uri": {
                    "type": Sequelize.STRING(255)
                },
                "created_at": {
                    "type": Sequelize.DATE,
                    "allowNull": false
                },
                "updated_at": {
                    "type": Sequelize.DATE,
                    "allowNull": false
                },
                "user_id": {
                    "type": Sequelize.INTEGER,
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "Users",
                        "key": "id"
                    },
                    "allowNull": true
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
            'OAuth2Clients'
        );
    }
};
