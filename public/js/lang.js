"use strict";

$(document).ready(function () {

    $(".dropdown-menu-lang li a").on('click', function () {
        var text = $(this).text();
        setLanguage(text.toLocaleLowerCase());
        $(this).parents('.lang').find('.dropdown-toggle').html(text + ' <span class="caret"></span>').dropdown('toggle');
    });
});

function setLanguage(lang) {
    $.ajax({
        url: '/i18n',
        type: 'POST',
        data: {
            lang: language,
            update_profile: 'no'
        },
        success: function (result) {
            location.reload();
        },
        error: function (error) {
        }
    });
}
