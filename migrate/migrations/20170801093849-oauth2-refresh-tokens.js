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
                queryInterface.createTable(
                    "OAuth2RefreshTokens",
                    {
                        "id": {
                            "type": Sequelize.INTEGER,
                            "autoIncrement": true,
                            "primaryKey": true
                        },
                        "key": {
                            "type": Sequelize.STRING(255),
                            "validate": {
                                "notEmpty": true
                            }
                        },
                        "expires_at": {
                            "type": Sequelize.BIGINT,
                            "validate": {
                                "notEmpty": true
                            }
                        },
                        "scope": {
                            "type": Sequelize.STRING(255)
                        },
                        "consumed": {
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
                        "user_id": {
                            "type": Sequelize.INTEGER,
                            "onUpdate": "cascade",
                            "onDelete": "set null",
                            "references": {
                                "model": "Users",
                                "key": "id"
                            },
                            "allowNull": true
                        },
                        "oauth2_client_id": {
                            "type": Sequelize.INTEGER,
                            "onUpdate": "cascade",
                            "onDelete": "set null",
                            "references": {
                                "model": "OAuth2Clients",
                                "key": "id"
                            },
                            "allowNull": true
                        }
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
                queryInterface.dropTable(
                    "OAuth2RefreshTokens"
                ).then(
                    resolve
                ).catch(
                    reject
                )
            }
        );
    }
};
