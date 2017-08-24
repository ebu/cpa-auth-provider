"use strict";

var config = require('../config');

module.exports = {

    getURL: function (provider) {
        switch(provider){
            case "facebook":
                return config.base_url + config.urlPrefix + config.identity_providers.facebook.callback_url;
                break;
            case "google":
                return config.base_url + config.urlPrefix + config.identity_providers.googleplus.callback_url;
                break;
            case "openam":
                return config.base_url + config.urlPrefix + config.identity_providers.openam.callback_url;
                break;
            default:
                return '';
                break;

        }
    }

};
