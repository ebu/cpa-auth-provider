"use strict";

$( document ).ready(function() {

    initLanguage();

    $(".dropdown-menu li a").on('click', function(){
        var text = $(this).text();
        initLanguage(text.toLocaleLowerCase());
        $(this).parents('.lang').find('.dropdown-toggle').html(text+' <span class="caret"></span>').dropdown('toggle');
    });
});

//TODO we need to add endpoints for each language so it sets i18n.setLocale() to the right locale and call them with ajax
// $.ajax({url: '/fr', type: 'POST', success: function(result){}, error: function(error){}});
function initLanguage(lang) {
    if(lang) {
        //TODO send request to set lang as language
        return;
    }

    console.log("browser language", getBrowserLanguage());
    console.log("cookie language", getCookieLanguage());

    var browserLang = getBrowserLanguage();
    var cookieLang = getCookieLanguage();

    if(cookieLang) {
        //TODO send request to set cookieLang as language
    } else {
        //TODO send request to set browserLang as language
    }

}

function getBrowserLanguage() {
    return navigator.language || navigator.userLanguage;
}

function getCookieLanguage() {
    return document.lang;
}