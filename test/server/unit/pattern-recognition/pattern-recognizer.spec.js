// test creation, functionality of individual pattern recognizers
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const knex = require('../../../../server/db/knex');
const dbUtil = require('../../../../server/db/util');
chai.use(chaiAsPromised);
const expect = chai.expect;
const PatternRecognizer = require('../../../../server/pattern-recognition/pattern-recognizer');
const config = require('config');

require('seedrandom');
Math.seedrandom('hello.');


describe('patternRecognizer', () => {
  beforeEach(function() {
    return dbUtil.emptyDb();
  });

  describe('constructor', () => {

  });

  describe('patternToString', () => {
    it('should turn the pattern passed to constructor into a string', () => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1, 2],
        actionState: [3, 4],
        driveState: [5, 6]
      });
      const expectedPatternString = `pattern_${[1, 2].join('_')}_${[3, 4].join('_')}_${[5, 6].join('_')}`;
      expect(patternRecognizer.patternToString()).to.equal(expectedPatternString);
    });
  });

  describe('createActionsTableIfNoneExists', () => {
    it('should create an actionsTable if none exists', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1, 2],
        actionState: [3, 4],
        driveState: [5, 6]
      });

      patternRecognizer.createActionsTableIfNoneExists('1_2_3_4').then(() => {
        knex.schema.hasTable('1_2_3_4').then(function(exists) {
          if (!exists) {
            expect(true).to.equal(false);
          } else {
            expect(true).to.equal(true);
          }
          done();
        });
      });
    });
  });

  describe('dropActionsTable', () => {
    it('should remove the actions table associated with a patternRecognizer', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1, 2],
        actionState: [3, 4],
        driveState: [5, 6]
      });

      patternRecognizer.createActionsTableIfNoneExists('pattern_1_2_3_4_5_6').then(() => { 
        patternRecognizer.dropActionsTable().then(() => {
          knex.schema.hasTable('pattern_1_2_3_4_5_6').then(function(exists) {
            if (exists) {
              expect(true).to.equal(false);
            } else {
              expect(true).to.equal(true);
            }
            done();
          });
        });
      }, () => {
        knex.schema.hasTable('pattern_1_2_3_4_5_6').then(function(exists) {
          if (exists) {
            expect(true).to.equal(false);
          } else {
            expect(true).to.equal(true);
          }
          done();
        });        
      });
    });
  });

  describe('createPointsTableIfNoneExists', () => {
    it('should create pointsTable if none exists', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1, 2],
        actionState: [3, 4],
        driveState: [5, 6]
      });

      const globalPointsTableName = config.get('db').globalPointsTableName;

      patternRecognizer.createPointsTableIfNoneExists().then(() => {
        knex.schema.hasTable(globalPointsTableName).then(function(exists) {
          if (!exists) {
            expect(true).to.equal(false);
          } else {
            expect(true).to.equal(true);
          }
          done();
        });
      }, () => {
        knex.schema.hasTable(globalPointsTableName).then(function(exists) {
          if (!exists) {
            expect(true).to.equal(false);
          } else {
            expect(true).to.equal(true);
          }
          done();
        });        
      });
    });
  });

  describe('addPointToPointsTable', () => {
    it('should add a patternRecognizer\'s n dimensional point to global points table', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1, 2],
        actionState: [3, 4],
        driveState: [5, 6]
      });

      const globalPointsTableName = config.get('db').globalPointsTableName;

      patternRecognizer.createPointsTableIfNoneExists().then(() => {
        patternRecognizer.addPointToPointsTable().then(() => {
          knex(globalPointsTableName).select().where('point', '=', patternRecognizer.patternToString()).then((results) => {
            expect(results).to.be.an('array').and.to.not.be.empty;
            expect(results[0].point_index_0).to.be.a('number').and.equal(1);
            expect(results[0].point_index_1).to.be.a('number').and.equal(2);
            expect(results[0].point_index_2).to.be.a('number').and.equal(3);
            expect(results[0].point_index_3).to.be.a('number').and.equal(4);
            expect(results[0].point_index_4).to.be.a('number').and.equal(5);
            expect(results[0].point_index_5).to.be.a('number').and.equal(6);
            expect(results[0].update_count).to.be.a('number').and.equal(0);
            done();
          });
        });
      });
    });
  });

  describe('removePointFromPointsTable', () => {
    it('should remove the patternRecognizer point from the global points table', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1, 2],
        actionState: [3, 4],
        driveState: [5, 6]
      });

      patternRecognizer.createPointsTableIfNoneExists().then(() => {
        patternRecognizer.addPointToPointsTable().then(() => {
          patternRecognizer.removePointFromPointsTable().then((result) => {
            // result is the number of rows affected; should be at least 1
            expect(result).to.be.a('number').and.to.be.above(0);
            done();
          });
        });
      });

    });
  });

  describe('initializeAllPossibleActions', () => {
    it('should add fields and random weights for all possible actions in patternRecognizer\'s actionsTable', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1],
        actionState: [2],
        driveState: [3]
      });

      patternRecognizer.createActionsTableIfNoneExists('pattern_1_2_3').then(() => {
        patternRecognizer.initializeAllPossibleActions([[-1, 1], ['a', 'b'], ['x', 'y']]).then(() => {
          knex.select('next_action', 'score').from('pattern_1_2_3').orderBy('next_action').then((output) => {
            const expectedOutput = [
              '-1_a_x',
              '-1_a_y',
              '-1_b_x',
              '-1_b_y',
              '1_a_x',
              '1_a_y',
              '1_b_x',
              '1_b_y'
            ];
            // output is an array of objects selected from db
            expect(output).to.be.an('array').and.to.not.be.empty;

            output.forEach((element, index) => {
              expect(element.next_action).to.equal(expectedOutput[index]);
              expect(element.score).to.be.a('number').at.least(0).and.at.most(1);
            });

            done();
          });
        });
      });
    });
  });

  describe('getBestNextAction', () => {
    it('should return its next action with lowest(best) score', (done) => {
      /* First eight expected results based on random number seed:
        0.9782811118900929
        0.4846980885530663
        0.6151119931966604
        0.23079158923818519
        0.06524674312107269 <= smallest value
        0.9845504147019434
        0.6623767463198407
        0.8629263044557318
      */

      const patternRecognizer = new PatternRecognizer({
        inputState: [1],
        actionState: [2],
        driveState: [3]
      });

      Math.seedrandom('hello.');
      patternRecognizer.createActionsTableIfNoneExists('pattern_1_2_3').then(() => {
        patternRecognizer.initializeAllPossibleActions([[-1, 1], ['a', 'b'], ['x', 'y']]).then(() => {

          patternRecognizer.getBestNextAction().then((result) => {
            expect(result).to.be.an('object');
            // basing this off seeded value, which will change based on number of times
            // Math.random() is called in this file
            expect(result.score).to.equal(0.06057665448709666);
            expect(result.next_action).to.equal('1_a_x');

            done();
          });
        });
      });
    });
  });

  describe('initializeTables', () => {
    it('should initialize actions, points tables if necessary, and add starting data', (done) => {

      done();
    });
  });

  describe('getPatternAsSingleArray', () => {
    it('should return a single array with all pattern array indices', () => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1, 2],
        actionState: [3, 4, 5],
        driveState: [6]
      });

      expect(patternRecognizer.getPatternAsSingleArray()).to.deep.equal([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('getUpdatesPerMinute', () => {
    it('should return updates per minute for the pattern recognizer', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1],
        actionState: [2],
        driveState: [3]
      });

      Math.seedrandom('hello.');
      patternRecognizer.createActionsTableIfNoneExists('pattern_1_2_3').then(() => {
        patternRecognizer.initializeAllPossibleActions([[-1, 1], ['a', 'b'], ['x', 'y']]).then(() => {

          patternRecognizer.updateNextMoveScore('-1_a_x', 10)
            .then(() => patternRecognizer.getUpdatesPerMinute())
            .then((result) => {
              expect(result).to.be.a('number');
              done();
            });
        });
      });
    });
  });

  describe('updateNextMoveScore', () => {
    it('should update next action scores based on experience', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1],
        actionState: [2],
        driveState: [3]
      });

      Math.seedrandom('hello.');
      patternRecognizer.createActionsTableIfNoneExists('pattern_1_2_3').then(() => {
        patternRecognizer.initializeAllPossibleActions([[-1, 1], ['a', 'b'], ['x', 'y']]).then(() => {

          patternRecognizer.updateNextMoveScore('-1_a_x', 10)
            .then((result) => {
              expect(result).to.equal(true);
              // get the updated move score from table
              // const expectedScore = (0.3684589274859717 * 9 + 10) / 10;
              // hard-coding for now until I make random number generation less brittle
              const expectedScore = 1.8354320916213211;

              knex.column('next_action', 'score')
                .select('score', 'next_action')
                .from('pattern_1_2_3')
                .where('next_action', '-1_a_x')
                .then((results) => {
                  expect(results.length).to.equal(1);
                  expect(results[0].score).to.equal(expectedScore);
                  expect(results[0].next_action).to.equal('-1_a_x');

                  done();
                });
            });
        });
      });
    });

    it('should increment the pattern\'s global points table update_count after an update', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1],
        actionState: [2],
        driveState: [3]
      });

      Math.seedrandom('hello.');
      patternRecognizer.createPointsTableIfNoneExists().then(
      patternRecognizer.addPointToPointsTable()).then(
      patternRecognizer.createActionsTableIfNoneExists('pattern_1_2_3')).then(() => {
        patternRecognizer.initializeAllPossibleActions([[-1, 1], ['a', 'b'], ['x', 'y']]).then(() => {

          patternRecognizer.updateNextMoveScore('-1_a_x', 10)
            .then((result) => {
              expect(result).to.equal(true);

              const globalPointsTableName = config.get('db').globalPointsTableName;
              knex(globalPointsTableName).select().where('point', '=', patternRecognizer.patternToString())
                .then((results) => {
                  expect(results.length).to.equal(1);
                  expect(results[0].update_count).to.equal(1);

                  done();
                });
            });
        });
      });
    });
  });
});
