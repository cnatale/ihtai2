// test creation, functionality of individual pattern recognizers
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const TimeStep = require('../../../../server/sliding-window/time-step');

describe('TimeStep', () => {
  it('should instantiate a TimeStep with actionKey, stateKey and score properties', () => {
    const timeStep = new TimeStep('1', '2_1_3', 2.5);
    expect(timeStep.actionKey).to.equal('1');
    expect(timeStep.stateKey).to.equal('2_1_3');
    expect(timeStep.score).to.equal(2.5);
  });

});
