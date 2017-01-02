"use strict";

var doT = require('dot');

module.exports = {

    /**
     * Helper function for sending email.
     *
     * @param {String} from              The sender
     * @param {String} to                The recipients
     * @param {String} template              The mail body template
     * @param {Object} opts              Various option...
     * @param {Object} data              Data that will be injected in the body template
     * @param {Function} done            Callback function, invoked when the HTTP request
     *                                   has completed
     */

    send: function (from, to, template, opts, data, done) {

        opts = opts || {};

        var doTempate = doT.template(template);
        var body = doTempate(data);

        if (opts.log) {
            console.log('Send message from \'' + from + '\' to \'' + to + '\' with body \'' + body + '\'');
        }

        done();
    }


};
