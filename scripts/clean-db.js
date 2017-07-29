const knexCleaner = require('knex-cleaner');
const knex = require('knex');
const config = require('config');

const log = require('../log');

knexCleaner.clean(knex({ client: config.db.type, connection: config.get(config.db.type) })).then(function() {
  log.info('Database successfully cleaned.');
  process.exit(0);
}).catch((reason) => {
  log.error('Database clean failed. Reason: ' + reason);
  log.error('Note that this will happen when knexCleaner.clean is run on nonexistent db.');
  process.exit(1);
});

