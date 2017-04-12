const knex = require('./db/knex');

module.exports = knex('test')
  .then((returnVal) => {
    console.log('RETURNVAL: ' + returnVal);
  });

// TODO: think about randomly weighting all possible actions at instantiation of node
