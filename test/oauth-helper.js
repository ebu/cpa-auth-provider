"use strict";

let db = require('../models');
let bcrypt = require('bcrypt');


module.exports = {
    createOAuth2Clients,
    createUsers,
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
                db.User.create(def).then(
                    function (user) {
                        return user.setPassword(def.password);
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



