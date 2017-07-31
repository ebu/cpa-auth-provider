"use strict";

//We use this to show nav and main content after everything else is loaded on the page
//because if an external css file contains some fonts for examples that are not loaded
//at start some css shifts may happen
$(window).on("load", function() {
    $('main').css('opacity', 1);
    $('nav').css('opacity', 1);
});