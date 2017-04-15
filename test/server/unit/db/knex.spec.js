// test connection with database, that it returns expected data
const chai = require('chai');
const _ = require('lodash');
const chaiAsPromised = require('chai-as-promised');
const knex = require('../../../../server/db/knex');
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('knex util', () => {
  it('should connect to db and get sample data', (done) => {
    knex('test')
      .then((results) => {
        expect(results).to.be.instanceof(Array);
        expect(results.length).to.be.above(0);
        _.forEach(results, function(result) {
          expect(result).to.have.property('a').that.is.a('string');
        });

        done();
      });
  });
});
