"use strict";

const prom_client = require('prom-client');

const METRICS = {
    EMAIL_SENT: 'idp_email_sent',
    ACCOUNT_CREATED: 'idp_account_created',
    ACCOUNT_VERIFIED: 'idp_account_verified',
};

module.exports = {
    METRICS,
    start,
    counter: counter(),
};

function start() {
    const express = require('express');

    const metricsApp = new express();
    const metricsPath = '/metrics';
    const metricsPort = 9022;

    let metricCollector = (req, res) => {
        let register = prom_client.register;

        res.set('Content-Type', register.contentType);
        res.end(register.metrics());
    };

    metricsApp.get(metricsPath, metricCollector);

    metricsApp.listen(metricsPort, '0.0.0.0', function onStart(err) {
        if (err) {
            console.log(err);
        }
        console.info('==> Listening on port %s. Open up http://0.0.0.0:%s/%s in your browser to see the prometheus metrics.',
            metricsPort, metricsPort, metricsPath);
    });
    prom_client.collectDefaultMetrics({timeout: 5000});
}

function counter() {
    let data = {};

    describe(METRICS.ACCOUNT_VERIFIED, 'Accounts who actively verified their email address');
    describe(METRICS.EMAIL_SENT, 'Emails sent from this instance');
    describe(METRICS.ACCOUNT_CREATED, 'Accounts created');

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
