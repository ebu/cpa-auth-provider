'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        /*
          Add altering commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.createTable('users', { id: Sequelize.INTEGER });
        */

        return queryInterface.sequelize.query("update \"UserProfiles\" set birthdate='0' where birthdate=''").then(function(){
            return queryInterface.changeColumn(
                'UserProfiles',
                'birthdate',
                {
                    type: 'BIGINT USING CAST("birthdate" as BIGINT)'
                }
            );
        });
        
    },

    down: function (queryInterface, Sequelize) {
        /*
          Add reverting commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.dropTable('users');
        */
        return queryInterface.changeColumn(
            'UserProfiles',
            'birthdate',
            {type: Sequelize.STRING(255)}
        );
    }
}
;
