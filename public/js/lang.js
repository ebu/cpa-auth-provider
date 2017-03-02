"use strict";

$(document).ready(function () {

    $(".dropdown-menu-lang li a").on('click', function () {
        var text = $(this).text();
        setLanguage(text.toLocaleLowerCase(), userLogged);
        $(this).parents('.lang').find('.dropdown-toggle').html(text + ' <span class="caret"></span>').dropdown('toggle');
    });

    $('.link-set-language').on('click', function(){
        setLanguage($(this).attr("data-lang").toLocaleLowerCase(), true);
    });

});

function setLanguage(language, logged) {
    var url = '/i18n/cookie';

    if (logged) {
        url = '/i18n/profile';
    }

    $.ajax({
        url: urlPrefix +  url,
        type: 'POST',
        data: {
            language: language
        },
        success: function (result) {
            location.reload();
        },
        error: function (error) {
        }
    });
}
