"use strict";

$(".password-test").on("keyup", function (event) {
    validatePassword($(this).val());
});

function validatePassword(password) {
    var passwordLabel = document.getElementById("password-error-label");
    var result = owaspPasswordStrengthTest.test(password);

    if (result.errors.length > 0 && password !== "") {
        passwordLabel.innerHTML = translateOwasp(result.errors[0]);
        passwordLabel.style.display = "block";
    } else {
        passwordLabel.style.display = "none";
    }
    setProgress(result);
}

function setProgress(result) {
    var progressBar = document.getElementById("password-progress");

    if (result.passedTests.length >= 7) {
        progressBar.style.width = "100%";
        return;
    }
    var progress = 100 - result.failedTests.length * 20;
    if (progress < 40) {
        progressBar.style.backgroundColor = "red";
    } else if (progress < 80) {
        progressBar.style.backgroundColor = "orange";
    } else {
        progressBar.style.backgroundColor = "green";
    }
    progressBar.style.width = progress + "%";
}

window.OWASP_TRANSLATIONS = window.OWASP_TRANSLATIONS || {};

var owaspPhrases = [
    {
        regex: /The password must be at least (\d+) characters long./,
        name: 'OWASP_PASSWORD_LENGTH_MIN'
    },
    {
        regex: /The password must be fewer than (\d+) characters./,
        name: 'OWASP_PASSWORD_LENGTH_MAX'
    },
    {
        regex: /The password may not contain sequences of three or more repeated characters./,
        name: 'OWASP_PASSWORD_REPEAT_CHARACTER'
    },
    {
        regex: /The password must contain at least one lowercase letter./,
        name: 'OWASP_PASSWORD_REQ_LOWERCASE'
    },
    {
        regex: /The password must contain at least one uppercase letter./,
        name: 'OWASP_PASSWORD_REQ_UPPERCASE'
    },
    {
        regex: /The password must contain at least one number./,
        name: 'OWASP_PASSWORD_REQ_NUMBER'
    },
    {
        regex: /The password must contain at least one special character./,
        name: 'OWASP_PASSWORD_REQ_SPECIAL'
    },
];

function translateOwasp(error) {
    for (var i = 0; i < owaspPhrases.length; ++i) {
        var test = owaspPhrases[i].regex.exec(error);
        if (test) {
            if (!window.OWASP_TRANSLATIONS.hasOwnProperty(owaspPhrases[i].name)) {
                return error;
            }
            var result = window.OWASP_TRANSLATIONS[owaspPhrases[i].name];
            if (test.length > 1) {
                result = result.replace(/{}/g, test[1]);
            }
            return result;
        }
    }
    return error;
}