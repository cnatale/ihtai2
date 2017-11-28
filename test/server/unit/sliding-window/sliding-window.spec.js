// test creation, functionality of individual pattern recognizers
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const SlidingWindow = require('../../../../server/sliding-window/sliding-window');

describe('SlidingWindow', () => {
  // TODO: improve test coverage
  // Think through whether you really want to get rid of time-step and use
  // two arrays directly in sliding-window. seems to make code messier

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

    expect(slidingWindow.timeSteps.length).to.equal(5);

    slidingWindow.timeSteps.map((timeStep, index) => {
      expect(timeStep.stateKey).to.equal(`${index}+${index}+${index}`);
      expect(timeStep.score).to.equal(index);
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

  it('should get the head of timeSteps', () => {
    const slidingWindow = new SlidingWindow(5);
    slidingWindow.addTimeStep('0+0+0', 0);
    slidingWindow.addTimeStep('1+1+1', 1);
    slidingWindow.addTimeStep('2+2+2', 2);

    const head = slidingWindow.getHead();
    expect(head).to.be.an('object');
    expect(head.stateKey).to.equal('0+0+0');
  });

  it('should get the tail\'s head of timeSteps', () => {
    const slidingWindow = new SlidingWindow(5);
    slidingWindow.addTimeStep('0+0+0', 0);
    slidingWindow.addTimeStep('1+1+1', 1);
    slidingWindow.addTimeStep('2+2+2', 2);

    const tailHead = slidingWindow.getTailHead();
    expect(tailHead).to.be.an('object');
    expect(tailHead.stateKey).to.equal('1+1+1');
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
      expect(timeStep.stateKey).to.equal(`${index + 1}+${index + 1}+${index + 1}`);
      expect(timeStep.score).to.equal(index + 1);
    });
  });

});
