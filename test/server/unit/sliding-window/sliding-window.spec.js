// test creation, functionality of individual pattern recognizers
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const SlidingWindow = require('../../../../server/sliding-window/sliding-window');

describe('SlidingWindow', () => {
  it('should return the number of timeSteps SlidingWindow is instantiated with', () => {
    const slidingWindow = new SlidingWindow(5);
    expect(slidingWindow.numberOfTimeSteps).to.equal(5);
  });

  it('should add TimeSteps to SlidingWindow instance', () => {
    const slidingWindow = new SlidingWindow(5);
    slidingWindow.addTimeStep('0+0+0', 0);
    slidingWindow.addTimeStep('1+1+1', 1);
    slidingWindow.addTimeStep('2+2+2', 2);
    slidingWindow.addTimeStep('3+3+3', 3);
    slidingWindow.addTimeStep('4+4+4', 4);

    const timeSteps = slidingWindow.timeSteps;

    expect(timeSteps.length).to.equal(5);

    timeSteps.map((timeStep, index) => {
      expect(timeStep.actionTakenKey).to.equal(`${index}+${index}+${index}`);
      expect(timeStep.driveScore).to.equal(index);
    });
  });

  it('should get the average drive score of all timeSteps', () => {
    const slidingWindow = new SlidingWindow(5);
    slidingWindow.addTimeStep('0+0+0', 0);
    slidingWindow.addTimeStep('1+1+1', 1);
    slidingWindow.addTimeStep('2+2+2', 2);
    slidingWindow.addTimeStep('3+3+3', 3);
    slidingWindow.addTimeStep('4+4+4', 4);   
    
    const expectedAverage = (0 + 1 + 2 + 3 + 4) / 5;
    expect(slidingWindow.getAverageDriveScore()).to.equal(expectedAverage);
  });

  it('when more timeSteps are added then the SlidingWindow can hold, remove earlier ones', () => {
    const slidingWindow = new SlidingWindow(5);
    slidingWindow.addTimeStep('0+0+0', 0);
    slidingWindow.addTimeStep('1+1+1', 1);
    slidingWindow.addTimeStep('2+2+2', 2);
    slidingWindow.addTimeStep('3+3+3', 3);
    slidingWindow.addTimeStep('4+4+4', 4);
    slidingWindow.addTimeStep('5+5+5', 5);

    const timeSteps = slidingWindow.timeSteps;

    timeSteps.map((timeStep, index) => {
      expect(timeStep.actionTakenKey).to.equal(`${index + 1}+${index + 1}+${index + 1}`);
      expect(timeStep.driveScore).to.equal(index + 1);
    });
  });

});
