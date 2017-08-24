"use strict";

var config = require('../config');

module.exports = {

    getURL: function (provider) {
        var callbackURI = '';
        switch(provider){
            case "facebook":
                callbackURI = config.base_url + config.urlPrefix + config.identity_providers.facebook.callback_url;
                break;
            case "google":
                callbackURI = config.base_url + config.urlPrefix + config.identity_providers.googleplus.callback_url;
                break;
            case "openam":
                callbackURI = config.base_url + config.urlPrefix + config.identity_providers.openam.callback_url;
                break;
            default:
                break;

        }
        return callbackURI;
    }

};
