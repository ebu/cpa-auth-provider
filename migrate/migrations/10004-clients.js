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
            "Clients",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true
                },
                "secret": {
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
                "software_id": {
                    "type": Sequelize.STRING(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "software_version": {
                    "type": Sequelize.STRING(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "ip": {
                    "type": Sequelize.STRING(255),
                    "validate": {
                        "isIP": true
                    }
                },
                "registration_type": Sequelize.ENUM('dynamic', 'static'),
                "redirect_uri": {
                    "type": Sequelize.STRING(255),
                    "allowNull": true
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
                    "onUpdate": "cascade",
                    "onDelete": "set null",
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
            'Clients'
        );
    }
};
