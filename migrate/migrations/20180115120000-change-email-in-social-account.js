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
                // Rename table oAuthProviders to SocialLogins
            }).then(function () {
                return queryInterface.renameTable('OAuthProviders', 'SocialLogins');
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
                // Create table local login
            }).then(function () {
                return queryInterface.createTable('LocalLogins', {
                    id: {
                        type: Seq.INTEGER,
                        autoIncrement: true,
                        primaryKey: true
                    },
                    login: {type: DataTypes.STRING, unique: true},
                    password: DataTypes.STRING,
                    verified: DataTypes.BOOLEAN,
                    password_changed_at: DataTypes.BIGINT,
                    last_login_at: DataTypes.BIGINT,
                    created_at: DataTypes.DATE,
                    updated_at: DataTypes.DATE,
                    user_id: {
                        type: Sequelize.BIGINT,
                        references: {
                            model: "Users",
                            key: "user_id"
                        }
                    }
                });
                // Move the data
            }).then(function () {
                return queryInterface.query("select * from Users");
            }).then(function (users) {
                // insert data in appropriate table
                for (var i = 0; i < users.length; i++) {
                    queryInterface.query("insert into LocalLogins (login, password, verified, password_changed_at, last_login_at, user_id) " +
                        " VALUES ('" + users[i].login + "', " + users[i].password + "', " + users[i].verified + "', " + users[i].password_changed_at + "', " + users[i].lastByte + "', " + users[i].id + "')");
                }

                return queryInterface.query("select * from Users");

                // Drop column

                // Drop table user profile

            }).then(resolve).catch(reject);
        });
    },

    down: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            queryInterface.removeColumn('UserProfiles', 'provider_uid').then(
                function () {
                    return queryInterface.dropTable('OAuthProviders');
                }
            ).then(resolve).catch(reject);
        });
    }
}
;
