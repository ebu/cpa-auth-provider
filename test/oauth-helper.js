"use strict";

const db = require('../models');
const bcrypt = require('bcrypt');
const requestHelper = require('./request-helper');


module.exports = {
    createOAuth2Clients,
    createUsers,
    getAccessToken,
};

function createOAuth2Clients(clientList) {
    return new Promise(
        function (resolve, reject) {
            let remaining = clientList.length;
            let errors = [];

            clientList.forEach(createOAuth2Client);

            function createOAuth2Client(def) {
                db.OAuth2Client.create(def).then(
                    function (client) {
                        return client.updateAttributes({client_secret: bcrypt.hashSync(client.client_secret, 1)});
                    }
                ).then(
                    function () {
                        remaining--;
                        if (remaining <= 0) {
                            if (errors.length > 0) {
                                return reject(errors[0]);
                            }
                            return resolve();
                        }
                    }
                ).catch(
                    function (err) {
                        remaining--;
                        errors.push(err);
                        if (remaining <= 0) {
                            return reject(err);
                        }
                    }
                );
            }
        }
    );
}

function createUsers(userList) {
    return new Promise(
        function (resolve, reject) {

            let remaining = userList.length;
            let errors = [];

            userList.forEach(createFakeUser);

            function createFakeUser(def) {
                return db.User.create(
                    def
                ).then(
                    function (user) {
                        if (def.email) {
                            return db.LocalLogin.create({login: def.email, user_id: user.id, verified: def.verified});
                        } else {
                            return new Promise((resolve, reject) => {
                                return resolve();
                            });
                        }

                    }
                ).then(
                    function (localLogin) {
                        if (localLogin) {
                            return localLogin.setPassword(def.password);
                        } else {
                            return new Promise((resolve, reject) => {
                                return resolve();
                            });
                        }
                    }
                ).then(
                    function () {
                        remaining--;
                        if (remaining <= 0) {
                            if (errors.length > 0) {
                                return reject(errors[0]);
                            }
                            return resolve();
                        }
                    }
                ).catch(
                    function (err) {
                        remaining--;
                        errors.push(err);
                        if (remaining <= 0) {
                            return reject(err);
                        }
                    }
                );
            }
        }
    );
}

function getAccessToken(email, user, client) {
    return function (done) {
        requestHelper.sendRequest(
            this,
            '/oauth2/token',
            {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    grant_type: 'password',
                    username: email,
                    password: user.password,
                    client_id: client.client_id,
                    client_secret: client.client_secret
                }
            },
            done
        );
    };
}
