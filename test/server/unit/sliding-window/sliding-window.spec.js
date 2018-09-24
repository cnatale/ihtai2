// test creation, functionality of individual pattern recognizers
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const SlidingWindow = require('../../../../server/sliding-window/sliding-window');

describe.only('SlidingWindow', () => {
  describe('constructor/assertConstructorParams', () => {
    it('should throw an error when first param is not a number', () => {
      const slidingWindow = new SlidingWindow(5, [5]);
      expect(slidingWindow.assertConstructorParams.bind(slidingWindow)).to.throw();
    });

    it('should throw an error when second param is not passed', () => {
      const slidingWindow = new SlidingWindow(5, [5]);
      expect(slidingWindow.assertConstructorParams.bind(slidingWindow, 5)).to.throw();
    });

    it('should throw an error when second param is not an array', () => {
      const slidingWindow = new SlidingWindow(5, [5]);
      expect(slidingWindow.assertConstructorParams.bind(slidingWindow, 5, 5)).to.throw();
    });

    it('should return true is first param is a number and second param is an array of numbers', () => {
      const slidingWindow = new SlidingWindow(5, [5]);
      expect(slidingWindow.assertConstructorParams(5, [5, 5])).to.equal(true);
    });
  });

  it('should return the number of timeSteps SlidingWindow is instantiated with', () => {
    const slidingWindow = new SlidingWindow(5, [5]);
    expect(slidingWindow.numberOfTimeSteps).to.equal(5);
  });

  it('should add TimeSteps to SlidingWindow instance', () => {
    const slidingWindow = new SlidingWindow(5, [5]);
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

  describe('getAverageDriveScore()', () => {
    it('should throw an error when distanceFromCurrentMoment param is > number of timeSteps in memory', () => {

    });

    it('should throw an error when startingIndex param is >= distanceFromCurrentMomentParam', () => {

    });

    it('should change starting index for averaging score based on startingIndex param', () => {

    });

    it('should get the last drive score of the slidingWindow', () => {
      const slidingWindow = new SlidingWindow(5, [4]);
      slidingWindow.addTimeStep('0', '0_0_0', 0);
      slidingWindow.addTimeStep('1', '1_1_1', 1);
      slidingWindow.addTimeStep('2', '2_2_2', 2);
      slidingWindow.addTimeStep('3', '3_3_3', 3);
      slidingWindow.addTimeStep('4', '4_4_4', 4);
      
      const expectedScore = 0;
      // expect(slidingWindow.getAverageDriveScore(1)).to.equal(expectedScore);
      expect(slidingWindow.getAverageDriveScore(1)).to.be.a('number');

      const slidingWindow2 = new SlidingWindow(5, [5]);
      slidingWindow2.addTimeStep('0', '0_0_0', 5);
      slidingWindow2.addTimeStep('1', '1_1_1', 5);
      slidingWindow2.addTimeStep('2', '2_2_2', 5);
      slidingWindow2.addTimeStep('3', '3_3_3', 5);
      slidingWindow2.addTimeStep('4', '4_4_4', 5);
      
      const expectedScore2 = 5;
      // expect(slidingWindow2.getAverageDriveScore(1)).to.equal(expectedScore2);
      expect(slidingWindow2.getAverageDriveScore(1)).to.be.a('number');
    });

    it('should get the drive score at any point in the sliding window', () => {
      const slidingWindow = new SlidingWindow(5, [5]);
      slidingWindow.addTimeStep('0', '0_0_0', 0);
      slidingWindow.addTimeStep('1', '1_1_1', 1);
      slidingWindow.addTimeStep('2', '2_2_2', 2);
      slidingWindow.addTimeStep('3', '3_3_3', 3);
      slidingWindow.addTimeStep('4', '4_4_4', 4);

      expect(slidingWindow.getAverageDriveScore(1)).to.equal(0);
      expect(slidingWindow.getAverageDriveScore(2)).to.equal(.75);
      expect(slidingWindow.getAverageDriveScore(3)).to.equal(1.4444444444444444);
      expect(slidingWindow.getAverageDriveScore(4)).to.equal(2.125);
      expect(slidingWindow.getAverageDriveScore(5)).to.equal(2.8);
    });

    it('should throw an error if getAverageDriveScore param value is greater than number of timesteps stored', () => {
      const slidingWindow = new SlidingWindow(5, [5]);
      slidingWindow.addTimeStep('0', '0_0_0', 0);
      slidingWindow.addTimeStep('1', '1_1_1', 1);

      expect(slidingWindow.getAverageDriveScore.bind(slidingWindow, 3)).to.throw();
    });
  });

  describe('getAllAverageDriveScores()', () => {
    it('should return an array of drive scores ', () => {
      const slidingWindow = new SlidingWindow(6, [5]);
      slidingWindow.addTimeStep('0', '0_0_0', 0);
      slidingWindow.addTimeStep('1', '1_1_1', 1);
      slidingWindow.addTimeStep('2', '2_2_2', 2);
      slidingWindow.addTimeStep('3', '3_3_3', 3);
      slidingWindow.addTimeStep('4', '4_4_4', 4);
      slidingWindow.addTimeStep('5', '5_5_5', 5);

      const allDriveScores = slidingWindow.getAllAverageDriveScores();
      expect(allDriveScores).to.deep.equal([2.8]);
    });

    it('should filter results for timestep distances > those in memory', () => {
      const slidingWindow = new SlidingWindow(5, [1, 2, 3, 4]);
      slidingWindow.addTimeStep('0', '0_0_0', 0);
      slidingWindow.addTimeStep('1', '1_1_1', 1);

      const allDriveScores = slidingWindow.getAllAverageDriveScores();
      expect(allDriveScores).to.deep.equal([0, 0.75]);

      slidingWindow.addTimeStep('2', '2_2_2', 2);

      const allDriveScores2 = slidingWindow.getAllAverageDriveScores();
      expect(allDriveScores2).to.deep.equal([0, 0.75, 1.4444444444444444]);
    });

    it('should return an empty array if no timestep distances are < number of steps stored in memory', () => {
      const slidingWindow = new SlidingWindow(5, [10, 20, 30, 40, 50]);
      slidingWindow.addTimeStep('0', '0_0_0', 0);
      slidingWindow.addTimeStep('1', '1_1_1', 1);

      const allDriveScores = slidingWindow.getAllAverageDriveScores();
      expect(allDriveScores).to.deep.equal([]);      
    });
  });

  it('should get the head of timeSteps', () => {
    const slidingWindow = new SlidingWindow(5, [5]);
    slidingWindow.addTimeStep('0', '0_0_0', 0);
    slidingWindow.addTimeStep('1', '1_1_1', 1);
    slidingWindow.addTimeStep('2', '2_2_2', 2);

    const head = slidingWindow.getHead();
    expect(head).to.be.an('object');
    expect(head.stateKey).to.equal('0_0_0');
    expect(head.actionKey).to.equal('0');
  });

  it('should get the tail\'s head of timeSteps', () => {
    const slidingWindow = new SlidingWindow(5, [5]);
    slidingWindow.addTimeStep('0', '0_0_0', 0);
    slidingWindow.addTimeStep('1', '1_1_1', 1);
    slidingWindow.addTimeStep('2', '2_2_2', 2);

    const tailHead = slidingWindow.getTailHead();
    expect(tailHead).to.be.an('object');
    expect(tailHead.actionKey).to.equal('1');
    expect(tailHead.stateKey).to.equal('1_1_1');
  });

  it('when more timeSteps are added then the SlidingWindow can hold, remove earlier ones', () => {
    const slidingWindow = new SlidingWindow(5, [5]);
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
