var displayUserInfo;

var CPA_COOKIE_NAME = 'cpa';
var FB_APP_ID = '533187713537471';

$(document).ready(function () {

    var authenticate = function (email, password) {
        $.post("/api/local/authenticate", {email: email, password: password},
            function (data, status, code) {
                //console.log(JSON.stringify(data) + " with status '" + status + "' and code  : " + code.status);
                if (code.status === 200) {
                    $('#myModal').modal('hide');
                    $('#login_link').hide();
                    $('#info_box').show();
                    //console.log("token :" + data.token);
                    getUserInfo(data.token);
                } else {
                    //TODO
                }
            });
    }

    var register = function (email, password, captcha) {
        $.post("/api/local/signup", {email: email, password: password, "g-recaptcha-response": captcha},
            function (data, status, code) {
                //console.log(JSON.stringify(data));
                if (code.status === 200) {
                    authenticate(email, password);
                } else {
                    //TODO
                }
            });
    }

    var getUserInfo = function (token) {
        $.ajax({
            type: 'GET',
            url: "/api/local/info",
            headers: {
                "authorization": token
            }
        }).done(function (data) {
            //console.log("infos :" + JSON.stringify(data));
            var name = data.user.email;
            if (data.user.display_name) {
                name = data.user.display_name;
            }
            var pictUrl = "/img/default_profile.png";
            if (data.user.photo_url) {
                pictUrl = data.user.photo_url;
            }

            //console.log("name :" + name);

            displayUserInfo(name, pictUrl);

            var cookieVal = JSON.stringify({token: token, name: name, pictUrl: pictUrl});

            $.cookie(CPA_COOKIE_NAME,
                cookieVal, // Value
                {
                    expires: 20 * 365           //expires in 20 years
                    // TODO , domain  : 'jquery.com',  //The value of the domain attribute of the cookie
                });

        });
    };

    displayUserInfo = function (name, pictUrl) {
        $("#info_box span").text(name);
        $("#userPicture").attr("src", pictUrl);
    }

    $("#login").click(function () {
        var email = $("#login_email").val();
        var password = $("#login_password").val();
        authenticate(email, password);
    });

    $("#signup").click(function () {
        var email = $("#signup_email").val();
        var password = $("#signup_password").val();
        register(email, password, grecaptcha.getResponse());
    });

    $("#disconnect").click(function () {
        $.removeCookie(CPA_COOKIE_NAME); // TODO
        $('#login_link').show();
        $('#info_box').hide();

        //FB.logout();

        FB.getLoginStatus(function(response) {
            if (response.status === 'connected') {
                FB.logout();
            }
        });


    });

    ////////////////////

    if ($.cookie(CPA_COOKIE_NAME)) {
        var c = JSON.parse($.cookie(CPA_COOKIE_NAME));
        ////console.log("cookie : " + c.name + " / " + c.pictUrl + " / " + c.token)
        displayUserInfo(c.name, c.pictUrl);
        $('#myModal').modal('hide');
        $('#login_link').hide();
        getUserInfo(c.token);

    } else {
        $('#info_box').hide();
    }


});


////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
//                                                                                    //
//                                 facebook                                           //
//                                                                                    //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////


// This is called with the results from from FB.getLoginStatus().
function statusChangeCallback(response) {
    //console.log('statusChangeCallback');
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    if (response.status === 'connected') {
        // Logged into your app and Facebook.
        //console.log("response");
        //console.log('token: ' + response.authResponse.accessToken);

        register(FB_APP_ID, response.authResponse.accessToken);
    } else if (response.status === 'not_authorized') {
        // The person is logged into Facebook, but not your app.
        document.getElementById('status').innerHTML = 'Please log ' +
            'into this app.';
    } else {
        // The person is not logged into Facebook, so we're not sure if
        // they are logged into this app or not.
        document.getElementById('status').innerHTML = 'Please log ' +
            'into Facebook.';
    }
}

// This function is called when someone finishes with the Login
// Button.  See the onlogin handler attached to it in the sample
// code below.
function checkLoginState() {
    FB.getLoginStatus(function (response) {
        statusChangeCallback(response);
    });
}

window.fbAsyncInit = function () {
    FB.init({
        appId: FB_APP_ID,
        cookie: true,  // enable cookies to allow the server to access
        // the session
        xfbml: true,  // parse social plugins on this page
        version: 'v2.5' // use graph api version 2.5
    });

    // Now that we've initialized the JavaScript SDK, we call
    // FB.getLoginStatus().  This function gets the state of the
    // person visiting this page and can return one of three states to
    // the callback you provide.  They can be:
    //
    // 1. Logged into your app ('connected')
    // 2. Logged into Facebook, but not your app ('not_authorized')
    // 3. Not logged into Facebook and can't tell if they are logged into
    //    your app or not.
    //
    // These three cases are handled in the callback function.

    FB.getLoginStatus(function (response) {
        statusChangeCallback(response);
    });

};

// Load the SDK asynchronously
(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.src = "http://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));



///////////
function register(appName, token) {
    //console.log('coucou');

    $.post("/api/facebook/signup", {fbToken: token, appName: appName},
        function (data, status, code) {
            //console.log(JSON.stringify(data) + " with status '" + status + "' and code  : " + code.status);
            if (code.status === 200) {
                $('#myModal').modal('hide');
                $('#login_link').hide();
                $('#info_box').show();
                //console.log("data.user.display_name:" + data.user.display_name);
                displayUserInfo(data.user.display_name, data.user.photo_url);
            }
        });
}