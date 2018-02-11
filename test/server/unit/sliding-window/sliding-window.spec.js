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
    slidingWindow.addTimeStep('0', '0_0_0', 0);
    slidingWindow.addTimeStep('1', '1_1_1', 1);
    slidingWindow.addTimeStep('2', '2_2_2', 2);
    slidingWindow.addTimeStep('3', '3_3_3', 3);
    slidingWindow.addTimeStep('4', '4_4_4', 4);

    expect(slidingWindow.timeSteps.length).to.equal(5);

    slidingWindow.timeSteps.map((timeStep, index) => {
      expect(timeStep.actionKey).to.equal(`${index}`);
      expect(timeStep.stateKey).to.equal(`${index}_${index}_${index}`);
      expect(timeStep.score).to.equal(index);
    });
  });

  it('should get the last drive score of the slidingWindow', () => {
    const slidingWindow = new SlidingWindow(5);
    slidingWindow.addTimeStep('0', '0_0_0', 0);
    slidingWindow.addTimeStep('1', '1_1_1', 1);
    slidingWindow.addTimeStep('2', '2_2_2', 2);
    slidingWindow.addTimeStep('3', '3_3_3', 3);
    slidingWindow.addTimeStep('4', '4_4_4', 4);
    
    const expectedScore = 4;
    expect(slidingWindow.getDriveScore()).to.equal(expectedScore);

    const slidingWindow2 = new SlidingWindow(5);
    slidingWindow2.addTimeStep('0', '0_0_0', 5);
    slidingWindow2.addTimeStep('1', '1_1_1', 5);
    slidingWindow2.addTimeStep('2', '2_2_2', 5);
    slidingWindow2.addTimeStep('3', '3_3_3', 5);
    slidingWindow2.addTimeStep('4', '4_4_4', 5);
    
    const expectedScore2 = 5;
    expect(slidingWindow2.getDriveScore()).to.equal(expectedScore2);
  });

  it('should get the head of timeSteps', () => {
    const slidingWindow = new SlidingWindow(5);
    slidingWindow.addTimeStep('0', '0_0_0', 0);
    slidingWindow.addTimeStep('1', '1_1_1', 1);
    slidingWindow.addTimeStep('2', '2_2_2', 2);

    const head = slidingWindow.getHead();
    expect(head).to.be.an('object');
    expect(head.stateKey).to.equal('0_0_0');
    expect(head.actionKey).to.equal('0');
  });

  it('should get the tail\'s head of timeSteps', () => {
    const slidingWindow = new SlidingWindow(5);
    slidingWindow.addTimeStep('0', '0_0_0', 0);
    slidingWindow.addTimeStep('1', '1_1_1', 1);
    slidingWindow.addTimeStep('2', '2_2_2', 2);

    const tailHead = slidingWindow.getTailHead();
    expect(tailHead).to.be.an('object');
    expect(tailHead.actionKey).to.equal('1');
    expect(tailHead.stateKey).to.equal('1_1_1');
  });

  it('when more timeSteps are added then the SlidingWindow can hold, remove earlier ones', () => {
    const slidingWindow = new SlidingWindow(5);
    slidingWindow.addTimeStep('0', '0_0_0', 0);
    slidingWindow.addTimeStep('1', '1_1_1', 1);
    slidingWindow.addTimeStep('2', '2_2_2', 2);
    slidingWindow.addTimeStep('3', '3_3_3', 3);
    slidingWindow.addTimeStep('4', '4_4_4', 4);
    slidingWindow.addTimeStep('5', '5_5_5', 5);

    const timeSteps = slidingWindow.timeSteps;

    timeSteps.map((timeStep, index) => {
      expect(timeStep.actionKey).to.equal(`${index + 1}`);
      expect(timeStep.stateKey).to.equal(`${index + 1}_${index + 1}_${index + 1}`);
      expect(timeStep.score).to.equal(index + 1);
    });
  });

});
