'use strict';

function getLocalProfileInsertQuery() {
    if (process.env.DB_TYPE === "postgres") {
        return "INSERT INTO public.\"LocalLogins\" (id, login, password, verified, password_changed_at, last_login_at, user_id, created_at, updated_at)  SELECT id, email, password, verified, password_changed_at, last_seen, id, created_at, updated_at FROM public.\"Users\"";
    } else {
        return "INSERT INTO LocalLogins (id, login, password, verified, password_changed_at, last_login_at, user_id, created_at, updated_at)  SELECT id, email, password, verified, password_changed_at, last_seen, id, created_at, updated_at FROM Users";
    }
}

function getUserUpdateQuery() {
    if (process.env.DB_TYPE === "postgres") {
        return "UPDATE public.\"Users\" SET firstname=up.firstname, lastname=up.lastname, gender=up.gender, date_of_birth=up.date_of_birth, language=up.language FROM public.\"Users\" as u, public.\"UserProfiles\" as up WHERE u.id=up.user_id";
    } else {
        return "UPDATE Users u, UserProfiles up SET u.firstname=up.firstname, u.lastname=up.lastname, u.gender=up.gender, u.date_of_birth=up.date_of_birth, u.language=up.language WHERE u.id=up.user_id";
    }
}


module.exports = {
    up: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            if (process.env.DB_TYPE === 'sqlite') {
                return resolve();
            }
            return queryInterface.sequelize.query(getLocalProfileInsertQuery()).then(function () {
                return queryInterface.sequelize.query(getUserUpdateQuery());
            }).then(resolve).catch(reject);
        });
    },

    down: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    }
}
