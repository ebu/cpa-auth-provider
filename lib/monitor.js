"use strict";

const prom_client = require('prom-client');

const METRICS = {
    EMAIL_SENT: 'idp_email_sent',
    ACCOUNT_CREATED: 'idp_account_created',
    ACCOUNT_VERIFIED: 'idp_account_verified',
    LOGIN_REQUESTED: 'idp_login_requested',
};
const STATS = {
    TOTAL_ACCOUNTS: 'idp_total_accounts',
    TOTAL_VERIFIED_ACCOUNTS: 'idp_total_verified_accounts',
};

let statsRegistry = new prom_client.Registry();
const stats = statistics();

module.exports = {
    METRICS,
    STATS,
    start,
    counter: counter(),
    stats: stats,
};

function start() {
    const config = require('../config');
    if (!config.monitoring || !config.monitoring.enabled) {
        return;
    }

    const express = require('express');

    const metricsApp = new express();
    const metricsPath = '/metrics';
    const metricsPort = 9022;

    metricsApp.get(metricsPath, metricCollector);
    metricsApp.get('/statistics', readStats, collector(statsRegistry));

    metricsApp.listen(metricsPort, '0.0.0.0', function onStart(err) {
        if (err) {
            console.log(err);
        }
        console.info('==> Listening on port %s. Open up http://0.0.0.0:%s/%s in your browser to see the prometheus metrics.',
            metricsPort, metricsPort, metricsPath);
    });
    prom_client.collectDefaultMetrics({timeout: 5000});

    function metricCollector(req, res) {
        let register = prom_client.register;

        res.set('Content-Type', register.contentType);
        res.end(register.metrics());
    }

    function collector(registry) {
        return (req, res) => {
            res.set('Content-Type', registry.contentType);
            res.end(registry.metrics());
        };
    }
}

function counter() {
    let data = {};

    describe(METRICS.ACCOUNT_VERIFIED, 'Accounts who actively verified their email address');
    describe(METRICS.EMAIL_SENT, 'Emails sent from this instance');
    describe(METRICS.ACCOUNT_CREATED, 'Accounts created');
    describe(METRICS.LOGIN_REQUESTED, 'Login or access tokens requested; describes usage of service.');

    return {
        describe,
        inc
    };

    function describe(name, help) {
        if (!data.hasOwnProperty(name)) {
            data[name] = new prom_client.Counter({name, help});
        }
    }

    function inc(name, value, help) {
        help = help || name;
        describe(name, help);
        data[name].inc(value);
    }
}

function statistics() {
    let data = {};
    describe(STATS.TOTAL_ACCOUNTS, 'Total currently existing accounts.');
    describe(STATS.TOTAL_VERIFIED_ACCOUNTS, 'Total currently verified accounts.');

    return {
        describe,
        set,
    };

    function describe(name, help) {
        if (!data.hasOwnProperty(name)) {
            data[name] = new prom_client.Gauge({name, help, registers: [statsRegistry]});
        }
    }

    function set(name, value, help) {
        help = help || name;
        describe(name, help);
        data[name].set(value);
    }
}

function readStats(req, res, next) {
    const db = require('../models');
    db.User.count().then(
        count => {
            stats.set(STATS.TOTAL_ACCOUNTS, count);
            return db.User.count({include: {model: db.LocalLogin, where: {'verified': true}}});
        }
    ).then(
        count => {
            stats.set(STATS.TOTAL_VERIFIED_ACCOUNTS, count);
            return next();
        }
    ).catch(
        e => {
            return next();
        }
    );

}