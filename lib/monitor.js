"use strict";

const br_prom = require('npm-modules/br-prom-client')();

const METRICS = {
    EMAIL_SENT: 'email_sent',
    ACCOUNT_CREATED: 'account_created',
    ACCOUNT_VERIFIED: 'account_verified',
    ACCESS_TOKEN_GRANTED: 'access_token_granted',
};

module.exports = {
    METRICS,
    start,
    counter: counter(),
};

function start() {
    br_prom.startServer();
}

function counter() {
    let data = {};

    return {
        describe,
        inc
    };

    function describe(name, help) {
        if (!data.hasOwnProperty(name)) {
            data[name] = br_prom.Counter(name, help);
        }
    }

    function inc(name, value, help) {
        describe(name, help);
        data[name].inc(value);
    }
}
