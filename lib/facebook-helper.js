"use strict";

var logger = require('../lib/logger');

// This is a fixed format string, like MM/DD/YYYY. However, people can control who can see the year they were born separately
// from the month and day so this string can be only the year (YYYY) or the month + day (MM/DD)
function fbDateOfBirthToTimestamp(fbDateOfBirth) {

    if (!fbDateOfBirth) {
        return null;
    }

    var year;
    var month;
    var day;
    var datePart = fbDateOfBirth.split("/");
    if (datePart.length === 3) {
        year = datePart[2];
        month = datePart[0];
        day = datePart[1];
    } else if (datePart.length === 2) {
        //year = new Date().getFullYear();
        month = datePart[0];
        day = datePart[1];
        // Cannot do anything without year
        return null;
    } else {
        throw "Unexpected data format on " + fbDateOfBirth + ". Format should be  MM/DD/YYYY or  MM/DD";
    }


    return new Date(Date.UTC(year, month - 1, day)).getTime();
}

function buildFBId(id) {
    return "fb:" + id;
}


module.exports = {
    fbDateOfBirthToTimestamp: fbDateOfBirthToTimestamp,
    buildFBId: buildFBId
};