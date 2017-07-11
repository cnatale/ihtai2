const PatternRecognitionGroup = require('../../../../server/pattern-recognition/pattern-recognition-group');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const knex = require('../../../../server/db/knex');
chai.use(chaiAsPromised);
const expect = chai.expect;
require('seedrandom');
Math.seedrandom('hello');

describe('patternRecognitionGroup', () => {
  function cleanUp() {
    return Promise.all([knex('pattern_1_2_3').del(), knex('global_points_table').del()]);
  }

  beforeEach(function() {
    return cleanUp();
  });

  describe('constructor', () => {
    // TODO: implement delete table functionality to clear individual pattern_ tables. Right now
    // these aren't cleared so it's causing duplicate row errors

    it.skip('should build a pattern-recognition-group based on a list of starting patterns and their possible drive states', () => {
      // TODO: refactor PatternRecognitionGroup and PatternRecognizers so that all promises are no
      // longer in the constructor function but instead a separate initialize function

      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [
          { inputState:[0], actionState: ['a'], driveState: ['x'] },
          { inputState: [1], actionState: ['b'], driveState: ['y'] }
        ],
        [[0, 1], ['a', 'b'], ['x', 'y']]
      ).then((result) => {
        expect(result).to.equal(true);
      });
    });    
  });

  describe('deletePatternRecognizer()', () => {
    it('should be able to delete a patternRecognizer when passed its pattern', () => {
      // TODO: still need logic added to pattern-recognizer
      // Actually this should probably be handled by a pattern-recognition-group
    });
  });

  describe('addPatternRecognizer()', () => {
    it('should add create a patternRecognizer when passed a pattern', () => {
      // TODO: maybe i need a pattern class as well for passing as a param here?

    });
  });

  describe('getNearestPatternRecognizer()', () => {
    it('should return nearest neighbor pattern when passed a pattern of matching dimensionality', () => {
      // TODO: calculate using global_points_table in db, which contains every point
      // May want to add a column for every dimension with naming convention dimension_[dimensionNumber]

    });
  });

  describe('scanRandomPatternForRemoval()', () => {
    it(`should select a random child pattern, and scan to see if it has been accessed below threshold
        minimum for a time period. If yes, return true.`, () => {

    });

    it(`should select a random child pattern, and scan to see if it has been accessed below threshold
        minimum for a time period. If no, return false.`, () => {

    });
  });

  describe('checkIfPatternShouldBeSplit()', () => {
    it(`should return true if the pattern passed in has been accessed above the min number of times in a
        given time period.`, () => {

    });
  });

  describe('updatePatternScore()', () => {
      // TODO: use sliding window to get next n time instances, get average drive score over 
      // sliding window period, then update next move score based on this new score in a weighted manner.
      // Will also need to keep track of total time this next move has been updated to know how much to 
      // weight existing score vs. new score. 

      // updatePatternScore should call the start pattern's updateNextMoveScore() method, passing in 
      // nextMove and score as params

      // should probably return fulfilled promise value of true when successful, or perhaps the updated
      // pattern score.s
  });

  describe('populateFromDb()', () => {
    it('should build a pattern-recognition-group from existing db when passed a pattern', () => {
      // TODO: populate pattern db tables with pattern recognizer data
      // TODO: write populateFromDb() method that gets all tables and creates
      //       1 patternRecognizer per table inside pattern-recognition-group 
    });
  });
});
