"use strict";

module.exports = {

    /**
     * Helper function for sending email.
     *
     * @param {String} from              The sender
     * @param {String} to                The recipients
     * @param {String} templateName      The mail template (in <project_dir>/templates/)
     * @param {Object} opts              Various option...
     * @param {Object} data              Data that will be injected in the body template
     * @param {Object} local             The template local
     * @param {Function} done            Callback function, invoked when the HTTP request
     *                                   has completed
     */

    send: function (from, to, templateName, opts, data, local, done) {

        local='ch_fr';
        if (opts.log) {
            console.log('from', from);
            console.log('to', to);
            console.log('templateName', templateName);
            console.log('opts', opts);
            console.log('data', data);
            console.log('local', local);
        }

        var EmailTemplate = require('email-templates').EmailTemplate
        var path = require('path')

        var templateDir = path.join(__dirname, '..', 'templates', templateName)

        var newsletter = new EmailTemplate(templateDir)

        newsletter.render(data, local, function (err, result) {
            if (opts.log) {
                console.log('About to send the following mail with from:' + from + ", to " + to + " :\n" + result.html);
            }
            // TODO: Send the email
            done();
        })

    }


};
