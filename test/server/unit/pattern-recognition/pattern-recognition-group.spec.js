const PatternRecognitionGroup = require('../../../../server/pattern-recognition/pattern-recognition-group');
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const knex = require('../../../../server/db/knex');
const _ = require('lodash');
chai.use(chaiAsPromised);
require('seedrandom');
Math.seedrandom('hello');
const config = require('config');


// TODO: validate params passed to this Class using is-my-json-valid npm module
// (especially the n-dimensional points and possible action values)

describe('PatternRecognitionGroup', () => {
  function cleanUp() {
    return Promise.all([knex('pattern_1_2_3').del(),
      knex('global_points_table').del(),
      knex('pattern_0_a_x').del(),
      knex('pattern_1_b_y').del(),
      knex('pattern_0_10_100').del(),
      knex('pattern_1_11_101').del()
    ])
      .then((values) => {
        return values;
      }, () => {
        return; // catch situation where these tables don't exist yet without breaking tests
      });

  }

  beforeEach(function() {
    return cleanUp();
  });

  describe('constructor/initialize()', () => {
    // TODO: implement delete table functionality to clear individual pattern_ tables. Right now
    // these aren't cleared so it's causing duplicate row errors

    it('should initialize a PatternRecognitionGroup, returning an array of true booleans, one for each PatternRecognizer generated', (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [
          { inputState:[0], actionState: ['10'], driveState: ['100'] },
          { inputState: [1], actionState: ['11'], driveState: ['101'] }
        ],
        [[0, 1], ['a', 'b'], ['x', 'y']]
      ).then((result) => {
        expect(_.every(result)).to.equal(true);
        done();
      });
    });
  });

  describe('addPatternRecognizer()', () => {
    it('should add a patternRecognizer when passed a pattern', (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [],
        [[0, 1], ['a', 'b'], ['x', 'y']]
      ).then((result) => {
        expect(result).to.be.an('array').and.to.be.empty;
        patternRecognitionGroup.addPatternRecognizer(
          { inputState:[0], actionState: ['10'], driveState: ['100'] }
        ).then((result) => {
          expect(result).to.equal(true);
          done();
        });
      });
    });

    it('should return rejected Promise if PatternRecognizer is not initialized first', () => {
      const patternRecognitionGroup = new PatternRecognitionGroup();

      return expect(patternRecognitionGroup.addPatternRecognizer(
        { inputState:[0], actionState: ['10'], driveState: ['100'] }
      )).to.be.rejectedWith(Error);
    });

    it('should add pattern recognizer data to appropriate tables when called', (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [],
        [[0, 1], ['a', 'b'], ['x', 'y']]
      ).then(() => {
        patternRecognitionGroup.addPatternRecognizer(
          { inputState:[0], actionState: [10], driveState: [100] }
        ).then(() => {
          // check db
          knex.schema.hasTable('pattern_0_10_100').then(function(exists) {
            if (!exists) {
              expect(true).to.equal(false);
            } else {
              expect(true).to.equal(true);
            }
          }).then(() => {
            const globalPointsTableName = config.get('db').globalPointsTableName;

            knex(globalPointsTableName).select().where('point', '=', 'pattern_0_10_100').then((results) => {
              expect(results).to.be.an('array').and.to.not.be.empty;
              expect(results[0].point_index_0).to.be.a('number').and.equal(0);
              expect(results[0].point_index_1).to.be.a('number').and.equal(10);
              expect(results[0].point_index_2).to.be.a('number').and.equal(100);
              done();
            });
          });

        });
      });

    });
  });

  describe('deletePatternRecognizer()', () => {
    it('should be able to delete a patternRecognizer when passed its pattern', () => {
      // TODO: the actual db cleanup logic should probably be stored in PatternRecognizer,
      // in line with where other db access methods are kept
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

  describe('addTimeStep()', () => {
    it('should add a timestep to sliding window', () => {

    });
  });

  describe('averageDriveScoresOverTimePeriod()', () => {
    it('should return a single number representing the average of all drive scores over the length of sliding window', () => {

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

      // TODO: need to implement sliding window before this can be completed
  });

  describe('populateFromDb()', () => {
    it('should build a pattern-recognition-group from existing db', () => {
      // TODO: populate pattern db tables with pattern recognizer data
      // TODO: write populateFromDb() method that gets all tables and creates
      //       1 patternRecognizer per table inside pattern-recognition-group
      // Can get each pattern recognizer info from global points table.
      // Probably need some type of equivalent populateFromDb() method in the PatternRecognizer class
      // as well.
    });
  });
});
