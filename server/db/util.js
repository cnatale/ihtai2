const knexCleaner = require('knex-cleaner');
const knex = require('knex');
const config = require('config');

exports.emptyDb = () => {
  return knexCleaner.clean(
    knex({ client: config.db.type, connection: config.get(config.db.type) })
  );
};
