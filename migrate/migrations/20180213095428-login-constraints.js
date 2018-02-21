'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return new Promise((resolve, reject) => {
            if (process.env.DB_TYPE === 'sqlite') {
                return resolve();
            }
            return queryInterface.getForeignKeyReferencesForTable('LocalLogins').then(
                details => {
                    let constraint = getRowForColumn('user_id', details);
                    return queryInterface.removeConstraint('LocalLogins', constraint.constraintName);
                }
            ).then(
                () => {
                    return queryInterface.addConstraint(
                        'LocalLogins',
                        ['user_id'],
                        {
                            type: 'foreign key',
                            name: 'fk_locallogins_user_id_users',
                            references: {table: 'Users', field: 'id'},
                            onDelete: 'cascade',
                            onUpdate: 'cascade',
                        }
                    );
                }
            ).then(
                () => {
                    return queryInterface.getForeignKeyReferencesForTable('SocialLogins');
                }
            ).then(
                details => {
                    let constraint = getRowForColumn('user_id', details);
                    return queryInterface.removeConstraint('SocialLogins', constraint.constraintName);
                }
            ).then(
                () => {
                    return queryInterface.addConstraint(
                        'SocialLogins',
                        ['user_id'],
                        {
                            type: 'foreign key',
                            name: 'fk_sociallogins_user_id_users',
                            references: {table: 'Users', field: 'id'},
                            onDelete: 'cascade',
                            onUpdate: 'cascade',
                        }
                    );
                }
            ).then(
                resolve
            ).catch(reject);
        });
    },

    down: function (queryInterface, Sequelize) {
        return new Promise((resolve, reject) => {
            return resolve();
        });
    }
};


/*
  output of getForeignKeyReferencesForTable:
identity-provider_1  |[ TextRow {
identity-provider_1  |     constraint_name: 'LocalLogins_user_id_Users_fk',
identity-provider_1  |     constraintName: 'LocalLogins_user_id_Users_fk',
identity-provider_1  |     constraintSchema: 'idp',
identity-provider_1  |     constraintCatalog: 'idp',
identity-provider_1  |     tableName: 'LocalLogins',
identity-provider_1  |     tableSchema: 'idp',
identity-provider_1  |     tableCatalog: 'idp',
identity-provider_1  |     columnName: 'user_id',
identity-provider_1  |     referencedTableSchema: 'idp',
identity-provider_1  |     referencedTableCatalog: 'idp',
identity-provider_1  |     referencedTableName: 'Users',
identity-provider_1  |     referencedColumnName: 'id' } ]
*/
function getRowForColumn(column, list) {
    for (let i = 0; i < list.length; ++i) {
        if (list[i].columnName === column && !!list[i].referencedColumnName) {
            return list[i];
        }
    }
    return null;
}
