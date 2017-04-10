"use strict";

function recaptchaReady () {
    grecaptcha.render('myrecaptcha', {
        'sitekey': siteKey,
        'expired-callback': function () {
            grecaptcha.reset();
            console.log('recatpcha');
        }
    });
}