"use strict";

function recaptchaReady () {
    if($('#myrecaptcha').length) {
        grecaptcha.render('myrecaptcha', {
            'sitekey': siteKey,
            'expired-callback': function () {
                grecaptcha.reset();
                console.log('recatpcha');
            }
        });
    }
}