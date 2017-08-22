"use strict";

$(".password-test").on("keyup", function(event){
   validatePassword($(this).val());
});

function validatePassword(password) {
    var passwordLabel = document.getElementById("password-error-label");
    var result = owaspPasswordStrengthTest.test(password);

    if(result.errors.length > 0 && password !== "") {
        passwordLabel.innerHTML = result.errors[0];
        passwordLabel.style.display = "block";
    } else {
        passwordLabel.style.display = "none";
    }
    setProgress(result);
}

function setProgress(result) {
    var progressBar = document.getElementById("password-progress");

    if(result.passedTests.length >= 7) {
        progressBar.style.width = "100%";
        return;
    }
    var progress = 100 - result.failedTests.length * 20;
    if(progress < 40) {
        progressBar.style.backgroundColor = "red";
    } else if(progress < 80) {
        progressBar.style.backgroundColor = "orange";
    } else {
        progressBar.style.backgroundColor = "green";
    }
    progressBar.style.width = progress + "%";
}