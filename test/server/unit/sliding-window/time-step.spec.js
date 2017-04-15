// test creation, functionality of individual pattern recognizers
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const TimeStep = require('../../../../server/sliding-window/time-step');

describe('TimeStep', () => {
  it('should instantiate a TimeStep with actionTakenKey and driveScore properties', () => {
    const timeStep = new TimeStep('2+1+3', 2.5);
    expect(timeStep.actionTakenKey).to.equal('2+1+3');
    expect(timeStep.driveScore).to.equal(2.5);
  });

});
