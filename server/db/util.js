const knexCleaner = require('knex-cleaner');
const knex = require('knex');
const knexInstance = require('./knex');
const config = require('config');

exports.emptyDb = (dropTables = false) => {
  const options = {};
  if (dropTables) { options.mode = 'delete'; }

  return knexCleaner.clean(
    knex(
      {
        client: config.db.type,
        connection: {
          host: config.mysql.host,
          user: config.mysql.user,
          password: config.mysql.password,
          database: config.mysql.database
        }
      }
    ),
    options
  ).then(() => {
    // dropping tables through knex-cleaner doesn't appear to work
    if (dropTables) {
      return knexInstance.schema.dropTableIfExists(config.db.globalPointsTableName);
    }
  });
};
