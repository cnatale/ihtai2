const knex = require('./db/knex');

module.exports = knex('test')
  .then((returnVal) => {
    console.log('RETURNVAL: ' + returnVal);
  });
