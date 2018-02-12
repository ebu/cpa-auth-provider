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
            }).then(function () {
                // Add new columns
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
            }).then(function () {
                if (process.env.DB_TYPE === "postgres") {
                    // rename sequence
                    return queryInterface.sequelize.query("ALTER SEQUENCE TODO RENAME TO LocalLogins_id_seq").then(function () {
                        // max from table User:
                        return queryInterface.sequelize.query("select max(id) from Users");
                    }).then(function (maxUserIdRes) {
                        // udpate sequence:
                        console.log("maxUserIdRes", maxUserIdRes);
                        return queryInterface.sequelize.query("Users_id_seq\" RESTART WITH " + (maxUserIdRes[0]) + 1);
                    }).then(function () {
                        // max from table LocalLogin:
                        return queryInterface.sequelize.query("select max(id) from LocalLogins");
                    }).then(function (maxLocalLoginIdRes) {
                        // udpate sequence:
                        console.log("maxLocalLoginIdRes", maxLocalLoginIdRes);
                        return queryInterface.sequelize.query("ALTER SEQUENCE \"LocalLogins_id_seq\" RESTART WITH " + (maxLocalLoginIdRes[0]) + 1);
                    }).then(function () {
                        resolve();
                    });
                } else {
                    resolve();
                }
            }).catch(reject);
        });
    },

    down: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    }
}
