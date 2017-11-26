const PatternRecognitionGroup = require('../../../../server/pattern-recognition/pattern-recognition-group');
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const knex = require('../../../../server/db/knex');
const dbUtil = require('../../../../server/db/util');
const _ = require('lodash');
chai.use(chaiAsPromised);
require('seedrandom');
Math.seedrandom('hello');
const config = require('config');


// TODO: validate params passed to this Class using is-my-json-valid npm module
// (especially the n-dimensional points and possible action values)

describe('PatternRecognitionGroup', () => {
  beforeEach(function() {
    return dbUtil.emptyDb();
  });

  describe('constructor/initialize()', () => {
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

    it('should initialize patternRecognitionGroup and create patternRecognizers', (done) => {
      // TODO: calculate using global_points_table in db, which contains every point
      // May want to add a column for every dimension with naming convention dimension_[dimensionNumber]
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [
          { inputState:[5], actionState: [5], driveState: [5] },
          { inputState: [10], actionState: [10], driveState: [10] },
          { inputState:[15], actionState: [15], driveState: [15] },
          { inputState: [20], actionState: [20], driveState: [20] }          
        ],
        [
          [0, 5, 10, 15, 20], 
          [0, 5, 10, 15, 20],
          [0, 5, 10, 15, 20]
        ]
      ).then(
      // check db for the patterns
      hasTable('pattern_5_5_5')).then(
      hasTable('pattern_10_10_10')).then(
      hasTable('pattern_15_15_15')).then(
      hasTable('pattern_20_20_20')).then(() => {
        const globalPointsTableName = config.get('db').globalPointsTableName;

        knex(globalPointsTableName).select().where('point', '=', 'pattern_5_5_5').then((results) => {
          expect(results).to.be.an('array').and.to.not.be.empty;

          expect(results[0].point_index_0).to.be.a('number').and.equal(5);
          expect(results[0].point_index_1).to.be.a('number').and.equal(5);
          expect(results[0].point_index_2).to.be.a('number').and.equal(5);
          done();
        });
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
        [[0, 1], [0, 10], [0, 100]]
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

  describe('sumOfSquaresQueryString()', () => {
    it('should return a sum of squares sql query string', () => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      const testArrays = {
        one: [1],
        two: [],
        three: [2, -3]
      };

      expect(testArrays.one.map(patternRecognitionGroup.sumOfSquaresQueryString).join(''))
        .to.equal('POWER(1 - point_index_0, 2)');
      expect(testArrays.two.map(patternRecognitionGroup.sumOfSquaresQueryString).join(''))
        .to.equal('');
      expect(testArrays.three.map(patternRecognitionGroup.sumOfSquaresQueryString).join(''))
        .to.equal('POWER(2 - point_index_0, 2) + POWER(-3 - point_index_1, 2)');
    });
  });

  describe('nearestNeighborQueryString()', () => {
    it('should return a nearest neighbor sql query string', () => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      const nDimensionalPoint = {
        inputState: [1],
        actionState: [],
        driveState: [2, -3]
      };

      expect(patternRecognitionGroup.nearestNeighborQueryString(nDimensionalPoint))
        .to.equal('POWER(1 - point_index_0, 2) + POWER(2 - point_index_1, 2) + POWER(-3 - point_index_2, 2)');
    });
  });

  describe('getNearestPatternRecognizer()', () => {
    it('should return nearest neighbor pattern table name when passed a pattern of matching dimensionality', (done) => {
      // May want to add a column for every dimension with naming convention dimension_[dimensionNumber]
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [
          { inputState:[5], actionState: [5], driveState: [5] },
          { inputState: [10], actionState: [10], driveState: [10] },
          { inputState:[0], actionState: [15], driveState: [0] },
          { inputState: [20], actionState: [20], driveState: [20] }          
        ],
        [
          [0, 5, 10, 15, 20], 
          [0, 5, 10, 15, 20],
          [0, 5, 10, 15, 20]
        ]
      ).then(
      // verify db has tables to match 
      hasTable('pattern_5_5_5')).then(
      hasTable('pattern_10_10_10')).then(
      hasTable('pattern_0_15_0')).then(
      hasTable('pattern_20_20_20')).then(() => {
        patternRecognitionGroup.getNearestPatternRecognizer(
          { inputState: [1], actionState: [16], driveState: [1] }
        ).then((result) => {
          // expected result form:
          // [ { point: 'pattern_0_15_0' } ]
          expect(result[0].point).to.equal('pattern_0_15_0');
        },
        (err) => {
          throw (err);
        });
      }).then(() => {
        patternRecognitionGroup.getNearestPatternRecognizer(
          { inputState: [4], actionState: [5], driveState: [4] }
        ).then((result) => {
          expect(result[0].point).to.equal('pattern_5_5_5');
        },
        (err) => {
          throw (err);
        });
      }).then(() => {
        patternRecognitionGroup.getNearestPatternRecognizer(
          { inputState: [20], actionState: [20], driveState: [20] }
        ).then((result) => {
          expect(result[0].point).to.equal('pattern_20_20_20');
        },
        (err) => {
          throw (err);
        });
      }).then(() => {
        patternRecognitionGroup.getNearestPatternRecognizer(
          { inputState: [8], actionState: [12], driveState: [9] }
        ).then((result) => {
          expect(result[0].point).to.equal('pattern_10_10_10');
          done();
        },
        (err) => {
          throw (err);
        });
      });
    });
  });

  describe('deletePatternRecognizer()', () => {
    it('should delete a patternRecognizer when passed its pattern', () => {
      // TODO: the actual db cleanup logic should probably be stored in PatternRecognizer,
      // in line with where other db access methods are kept
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
      // TODO: update next move score based on this new score in a weighted manner.
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

function hasTable (tableName) {
  return knex.schema.hasTable(tableName).then(function(exists) {
    if (!exists) {
      expect(true).to.equal(false);
    } else {
      expect(true).to.equal(true);
    }
  });
}
