'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * removeColumn "email_redirect_uri" from table "OAuth2Clients"
 * removeColumn "admin" from table "Users"
 * removeColumn "email_verified" from table "Users"
 * createTable "Permissions", deps: []
 * createTable "ValidationCodes", deps: [Users]
 * createTable "OAuth2RefreshTokens", deps: [Users, OAuth2Clients]
 * addColumn "password_changed_at" to table "Users"
 * addColumn "jwt_code" to table "OAuth2Clients"
 * addColumn "permission_id" to table "Users"
 * addColumn "last_login_at" to table "Users"
 * addColumn "language" to table "UserProfiles"
 * addColumn "verified" to table "Users"
 * changeColumn "email" on table "Users"
 * addIndex ["key"] to table "OAuth2RefreshTokens"
 *
 **/

var info = {
    "revision": 2,
    "name": "br-idp-merge",
    "created": "2017-08-01T11:14:52.043Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "removeColumn",
        params: ["OAuth2Clients", "email_redirect_uri"]
    },
    {
        fn: "removeColumn",
        params: ["Users", "admin"]
    },
    {
        fn: "removeColumn",
        params: ["Users", "email_verified"]
    },
    {
        fn: "createTable",
        params: [
            "Permissions",
            {
                "id": {
                    "type": INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true
                },
                "label": {
                    "type": VARCHAR(255),
                    "unique": true
                },
                "created_at": {
                    "type": DATETIME,
                    "allowNull": false
                },
                "updated_at": {
                    "type": DATETIME,
                    "allowNull": false
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "ValidationCodes",
            {
                "id": {
                    "type": INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true
                },
                "date": {
                    "type": BIGINT,
                    "validate": {
                        "notEmpty": true
                    }
                },
                "value": {
                    "type": VARCHAR(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "type": {
                    "type": TEXT,
                    "validate": {
                        "notEmpty": true
                    },
                    "defaultValue": "email"
                },
                "created_at": {
                    "type": DATETIME,
                    "allowNull": false
                },
                "updated_at": {
                    "type": DATETIME,
                    "allowNull": false
                },
                "user_id": {
                    "type": INTEGER,
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "Users",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "OAuth2RefreshTokens",
            {
                "id": {
                    "type": INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true
                },
                "key": {
                    "type": VARCHAR(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "expires_at": {
                    "type": BIGINT,
                    "validate": {
                        "notEmpty": true
                    }
                },
                "scope": {
                    "type": VARCHAR(255)
                },
                "consumed": {
                    "type": TINYINT(1)
                },
                "created_at": {
                    "type": DATETIME,
                    "allowNull": false
                },
                "updated_at": {
                    "type": DATETIME,
                    "allowNull": false
                },
                "user_id": {
                    "type": INTEGER,
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "Users",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "oauth2_client_id": {
                    "type": INTEGER,
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "OAuth2Clients",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "addColumn",
        params: [
            "Users",
            "password_changed_at",
            {
                "type": BIGINT
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "OAuth2Clients",
            "jwt_code",
            {
                "type": VARCHAR(255),
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "Users",
            "permission_id",
            {
                "type": INTEGER,
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "Permissions",
                    "key": "id"
                },
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "Users",
            "last_login_at",
            {
                "type": BIGINT
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "UserProfiles",
            "language",
            {
                "type": VARCHAR(255)
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "Users",
            "verified",
            {
                "type": TINYINT(1)
            }
        ]
    },
    {
        fn: "changeColumn",
        params: [
            "Users",
            "email",
            {
                "type": VARCHAR(255),
                "unique": true
            }
        ]
    },
    {
        fn: "addIndex",
        params: [
            "OAuth2RefreshTokens", ["key"],
            {
                "indicesType": "UNIQUE"
            }
        ]
    }
];

module.exports = {
    pos: 0,
    up: function(queryInterface, Sequelize)
    {
        var index = this.pos;
        return new Promise(function(resolve, reject) {
            function next() {
                if (index < migrationCommands.length)
                {
                    let command = migrationCommands[index];
                    console.log("[#"+index+"] execute: " + command.fn);
                    index++;
                    queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                }
                else
                    resolve();
            }
            next();
        });
    },
    info: info
};
