const knex = require('knex');
const config = require('config');
const log = require('../../log');
const sqlformatter = require('sqlformatter');

const mysqlKnex = knex({ client: 'mysql', connection: config.get('mysql') });

mysqlKnex.on('query', function logQuery(q) {
  const border = '**********************';
  log.debug(
    border + '\n QUERY: ',
    sqlformatter.format(q.sql),
    '\n BINDINGS: \n',
    border + '\n\t' + q.bindings.join(' | ') + '\n' + border
  );
});

module.exports = mysqlKnex;
