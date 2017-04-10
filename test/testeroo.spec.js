process.env.NODE_ENV = 'test';

const expect = require('chai').expect;

describe('tests', function() {
  it('should run a test', function() {
    expect(2).to.equal(2);
  });
});
