const knex = require('knex');
const config = require('config');
const log = require('../../log');
const sqlformatter = require('sqlformatter');

const mysqlKnex = knex({
  client: config.db.type,
  connection: {
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
  }
});

log.info('NODE_ENV:', process.env.NODE_ENV);
log.info('Created Mysql connection');
log.info('host: ' + config.mysql.host);
log.info('user: ' + config.mysql.user);
log.info('database: ' + config.mysql.database);

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
