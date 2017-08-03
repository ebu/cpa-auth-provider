'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "Domains", deps: []
 * createTable "IdentityProviders", deps: []
 * createTable "Users", deps: [IdentityProviders]
 * createTable "Clients", deps: [Users]
 * createTable "AccessTokens", deps: [Clients, Domains, Users]
 * createTable "OAuth2Clients", deps: [Users]
 * createTable "OAuth2AuthorizationCodes", deps: [OAuth2Clients, Users, OAuth2Clients]
 * createTable "PairingCodes", deps: [Clients, Domains, Users]
 * createTable "UserEmailTokens", deps: [Users, OAuth2Clients]
 * createTable "UserProfiles", deps: [Users]
 *
 **/

var info = {
    "revision": 1,
    "name": "initial",
    "created": "2017-08-01T11:04:45.241Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "createTable",
        params: [
            "Domains",
            {
                "id": {
                    "type": INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true
                },
                "name": {
                    "type": VARCHAR(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "display_name": {
                    "type": VARCHAR(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "access_token": {
                    "type": VARCHAR(255),
                    "validate": {
                        "notEmpty": true
                    }
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
            "IdentityProviders",
            {
                "id": {
                    "type": INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true
                },
                "name": {
                    "type": VARCHAR(255)
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
            "Users",
            {
                "id": {
                    "type": INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true
                },
                "account_uid": {
                    "type": VARCHAR(255)
                },
                "tracking_uid": {
                    "type": VARCHAR(255)
                },
                "provider_uid": {
                    "type": VARCHAR(255)
                },
                "email": {
                    "type": VARCHAR(255)
                },
                "email_verified": {
                    "type": TINYINT(1)
                },
                "password": {
                    "type": VARCHAR(255)
                },
                "enable_sso": {
                    "type": TINYINT(1)
                },
                "display_name": {
                    "type": VARCHAR(255)
                },
                "photo_url": {
                    "type": VARCHAR(255)
                },
                "admin": {
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
                "identity_provider_id": {
                    "type": INTEGER,
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "IdentityProviders",
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
            "Clients",
            {
                "id": {
                    "type": INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true
                },
                "secret": {
                    "type": VARCHAR(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "name": {
                    "type": VARCHAR(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "software_id": {
                    "type": VARCHAR(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "software_version": {
                    "type": VARCHAR(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "ip": {
                    "type": VARCHAR(255),
                    "validate": {
                        "isIP": true
                    }
                },
                "registration_type": {
                    "type": TEXT,
                    "validate": {
                        "notEmpty": true
                    },
                    "defaultValue": "dynamic"
                },
                "redirect_uri": {
                    "type": VARCHAR(255),
                    "allowNull": true
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
            "AccessTokens",
            {
                "id": {
                    "type": INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true
                },
                "token": {
                    "type": VARCHAR(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "created_at": {
                    "type": DATETIME,
                    "allowNull": false
                },
                "updated_at": {
                    "type": DATETIME,
                    "allowNull": false
                },
                "client_id": {
                    "type": INTEGER,
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "Clients",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "domain_id": {
                    "type": INTEGER,
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "Domains",
                        "key": "id"
                    },
                    "allowNull": true
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
            "OAuth2Clients",
            {
                "id": {
                    "type": INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true
                },
                "client_id": {
                    "type": VARCHAR(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "client_secret": {
                    "type": VARCHAR(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "name": {
                    "type": VARCHAR(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "redirect_uri": {
                    "type": VARCHAR(255),
                    "allowNull": true
                },
                "email_redirect_uri": {
                    "type": VARCHAR(255)
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
            "OAuth2AuthorizationCodes",
            {
                "id": {
                    "type": INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true
                },
                "authorization_code": {
                    "type": VARCHAR(255)
                },
                "redirect_uri": {
                    "type": VARCHAR(255)
                },
                "state": {
                    "type": VARCHAR(255)
                },
                "created_at": {
                    "type": DATETIME,
                    "allowNull": false
                },
                "updated_at": {
                    "type": DATETIME,
                    "allowNull": false
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
                "o_auth2_client_id": {
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
        fn: "createTable",
        params: [
            "PairingCodes",
            {
                "id": {
                    "type": INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true
                },
                "device_code": {
                    "type": VARCHAR(255)
                },
                "user_code": {
                    "type": VARCHAR(255)
                },
                "verification_uri": {
                    "type": VARCHAR(255)
                },
                "state": {
                    "type": TEXT,
                    "validate": {
                        "notEmpty": true
                    },
                    "defaultValue": "pending"
                },
                "created_at": {
                    "type": DATETIME,
                    "allowNull": false
                },
                "updated_at": {
                    "type": DATETIME,
                    "allowNull": false
                },
                "client_id": {
                    "type": INTEGER,
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "Clients",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "domain_id": {
                    "type": INTEGER,
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "Domains",
                        "key": "id"
                    },
                    "allowNull": true
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
            "UserEmailTokens",
            {
                "key": {
                    "type": VARCHAR(255),
                    "primaryKey": true
                },
                "type": {
                    "type": VARCHAR(255),
                    "validate": {
                        "notEmpty": true
                    }
                },
                "sub": {
                    "type": VARCHAR(255)
                },
                "redirect_uri": {
                    "type": VARCHAR(255),
                    "allowNull": true
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
        fn: "createTable",
        params: [
            "UserProfiles",
            {
                "id": {
                    "type": INTEGER,
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
                "firstname": {
                    "type": VARCHAR(255)
                },
                "lastname": {
                    "type": VARCHAR(255)
                },
                "gender": {
                    "type": VARCHAR(255)
                },
                "birthdate": {
                    "type": VARCHAR(255)
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
