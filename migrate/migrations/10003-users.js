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
            "Users",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true
                },
                "account_uid": {
                    "type": Sequelize.STRING(255)
                },
                "tracking_uid": {
                    "type": Sequelize.STRING(255)
                },
                "provider_uid": {
                    "type": Sequelize.STRING(255)
                },
                "email": {
                    "type": Sequelize.STRING(255)
                },
                "email_verified": {
                    "type": Sequelize.BOOLEAN
                },
                "password": {
                    "type": Sequelize.STRING(255)
                },
                "enable_sso": {
                    "type": Sequelize.BOOLEAN
                },
                "display_name": {
                    "type": Sequelize.STRING(255)
                },
                "photo_url": {
                    "type": Sequelize.STRING(255)
                },
                "admin": {
                    "type": Sequelize.BOOLEAN
                },
                "created_at": {
                    "type": Sequelize.DATE,
                    "allowNull": false
                },
                "updated_at": {
                    "type": Sequelize.DATE,
                    "allowNull": false
                },
                "identity_provider_id": {
                    "type": Sequelize.INTEGER,
                    "onUpdate": "cascade",
                    "onDelete": "set null",
                    "references": {
                        "model": "IdentityProviders",
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
            'Users'
        );
    }
};
