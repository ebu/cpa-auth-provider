'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            // Add new columns to table Users
            return queryInterface.addColumn(
                "Users",
                "firstname",
                {
                    type: Sequelize.STRING,
                    allowNull: true
                }
            ).then(function () {
                return queryInterface.addColumn(
                    "Users",
                    "lastname",
                    {
                        type: Sequelize.STRING,
                        allowNull: true
                    }
                );
            }).then(function () {
                return queryInterface.addColumn(
                    "Users",
                    "gender",
                    {
                        type: Sequelize.STRING,
                        allowNull: true
                    }
                );
            }).then(function () {
                return queryInterface.addColumn(
                    "Users",
                    "date_of_birth",
                    {
                        type: Sequelize.BIGINT,
                        allowNull: true
                    }
                );
            }).then(function () {
                return queryInterface.addColumn(
                    "Users",
                    "language",
                    {
                        type: Sequelize.STRING,
                        allowNull: true
                    }
                );
            }).then(function () {
                return queryInterface.renameColumn(
                    "Users",
                    "last_login_at",
                    "last_seen"
                );
                // Rename table oAuthProviders to SocialLogins
            }).then(function () {
                return queryInterface.renameTable("OAuthProviders", "SocialLogins");
                // Add new columns
            }).then(function () {
                return queryInterface.addColumn(
                    "SocialLogins",
                    "email",
                    {
                        type: Sequelize.STRING,
                        allowNull: true
                    }
                );
            }).then(function () {
                return queryInterface.addColumn(
                    "SocialLogins",
                    "firstname",
                    {
                        type: Sequelize.STRING,
                        allowNull: true
                    }
                );
            }).then(function () {
                return queryInterface.addColumn(
                    "SocialLogins",
                    "lastname",
                    {
                        type: Sequelize.STRING,
                        allowNull: true
                    }
                );
            }).then(function () {
                return queryInterface.addColumn(
                    "SocialLogins",
                    "gender",
                    {
                        type: Sequelize.STRING,
                        allowNull: true
                    }
                );
            }).then(function () {
                return queryInterface.addColumn(
                    "SocialLogins",
                    "date_of_birth",
                    {
                        type: Sequelize.STRING,
                        allowNull: true
                    }
                );
            }).then(function () {
                return queryInterface.addColumn(
                    "SocialLogins",
                    "language",
                    {
                        type: Sequelize.STRING,
                        allowNull: true
                    }
                );
            }).then(function () {
                return queryInterface.addColumn(
                    "SocialLogins",
                    "last_login_at",
                    {
                        type: Sequelize.STRING,
                        allowNull: true
                    }
                );
                // Create table local login
            }).then(function () {
                return queryInterface.createTable('LocalLogins', {
                    id: {
                        type: Sequelize.INTEGER,
                        autoIncrement: true,
                        primaryKey: true
                    },
                    login: {type: Sequelize.STRING, unique: true},
                    password: Sequelize.STRING,
                    verified: Sequelize.BOOLEAN,
                    password_changed_at: Sequelize.BIGINT,
                    last_login_at: Sequelize.BIGINT,
                    created_at: Sequelize.DATE,
                    updated_at: Sequelize.DATE,
                    user_id: Sequelize.INTEGER
                });
            }).then(function () {
                // Constraint is added after otherwise it fail on mysql
                return queryInterface.addConstraint("LocalLogins", ["user_id"], {
                    type: "FOREIGN KEY",
                    references: {
                        table: "Users",
                        field: "id"
                    }
                });
            }).then(resolve).catch(reject);
        });
    },

    down: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    }
}
