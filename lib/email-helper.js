"use strict";

module.exports = {

    /**
     * Helper function for sending email.
     *
     * @param {String} from              The sender
     * @param {String} to                The recipients
     * @param {String} body              The mail body
     * @param {Object} opts              Various option...
     * @param {Function} done            Callback fuction, invoked when the HTTP request
     *                                   has completed
     */

    send: function (from, to, body, opts, done) {
        opts = opts || {};

        if (! opts.test){
            console.log('Send message from ' + from + ' to ' + to + ' with body ' + body);
        }

        done();
    }
};
