'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        /*
          Add altering commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.createTable('users', { id: Sequelize.INTEGER });
        */
        queryInterface.changeColumn(
            'User_Profiles',
            'birthdate',
            {type: Sequelize.BIGINT}
        );
    },

    down: function (queryInterface, Sequelize) {
        /*
          Add reverting commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.dropTable('users');
        */
        queryInterface.changeColumn(
            'User_Profiles',
            'birthdate',
            {type: Sequelize.STRING(255)}
        );
    }
};
