// test creation, functionality of individual pattern recognizers
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const knex = require('../../../../server/db/knex');
const dbUtil = require('../../../../server/db/util');
chai.use(chaiAsPromised);
const _ = require('lodash');
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
        const tableName = '1_2_3_4';
        Promise.all([
          knex.schema.hasTable(tableName),
          knex.schema.hasColumn(tableName, 'next_action'),
          knex.schema.hasColumn(tableName, 'score'),
          knex.schema.hasColumn(tableName, 'time_period')
        ]).then(function(results) {
          if (!results.every((result) => result === true)) {
            expect(true).to.equal(false);
          } else {
            expect(true).to.equal(true);
          }

          return knex.raw('SHOW INDEX FROM `1_2_3_4`');
        }).then(() => {
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

      knex.schema.dropTableIfExists(config.db.globalPointsTableName).then(() =>
      patternRecognizer.createPointsTableIfNoneExists()).then(() =>
      patternRecognizer.addPointToPointsTable()).then(() =>
      knex(globalPointsTableName).select().where('point', '=', patternRecognizer.patternToString())).then((results) => {
        expect(results).to.be.an('array').and.to.not.be.empty;
        expect(results[0].point_index_0).to.be.a('number').and.equal(1);
        expect(results[0].point_index_1).to.be.a('number').and.equal(2);
        expect(results[0].point_index_2).to.be.a('number').and.equal(3);
        expect(results[0].point_index_3).to.be.a('number').and.equal(4);
        expect(results[0].point_index_4).to.be.a('number').and.equal(5);
        expect(results[0].point_index_5).to.be.a('number').and.equal(6);
        expect(results[0].update_count).to.be.a('number').and.equal(0);
        expect(results[0].first_action_index).to.be.a('number').and.equal(2);
        expect(results[0].first_drive_index).to.be.a('number').and.equal(4);
        done();
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

      knex.schema.dropTableIfExists(config.db.globalPointsTableName).then(() =>
      patternRecognizer.createPointsTableIfNoneExists()).then(() =>
      patternRecognizer.addPointToPointsTable()).then(() =>
      patternRecognizer.removePointFromPointsTable()).then((result) => {
        // result is the number of rows affected; should be at least 1
        expect(result).to.be.a('number').and.to.be.above(0);
        done();
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

      // Note: As of commit 9b1b5fdf4b60e9b2238f2a1d7973b775cef9f65b,
      // actions are initialized with a score of 0 instead of a random number.

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
            expect(result.score).to.equal(0);
            expect(result.next_action).to.equal('-1_a_x');

            done();
          });
        });
      });
    });
  });

  // initializes all tables that a PatternRecognizer needs
  describe('initializeTables', () => {
    it('should initialize actions, points tables if necessary, and add starting data', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1],
        actionState: [2],
        driveState: [3]
      });

      patternRecognizer.createActionsTableIfNoneExists('pattern_1_2_3').then(() =>
      patternRecognizer.initializeTables([[0, 1], [2, 3], [4, 5]])).then((result) => {
        expect(result.length).to.equal(2);
        expect(_.flatten(result)[0]).to.be.a('number');
        expect(_.flatten(result)[1]).to.be.a('number');
        done();
      });
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
    it.skip('should return updates per minute for the pattern recognizer', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1],
        actionState: [2],
        driveState: [3]
      });

      Math.seedrandom('hello.');
      patternRecognizer.createActionsTableIfNoneExists('pattern_1_2_3').then(() => {
        patternRecognizer.initializeAllPossibleActions([[-1, 1], ['a', 'b'], ['x', 'y']]).then(() => {

          patternRecognizer.updateNextMoveScores('-1_a_x', [10])
            .then(() => patternRecognizer.getUpdatesPerMinute())
            .then((result) => {
              expect(result).to.be.a('number');
              done();
            });
        });
      });
    });
  });

  describe('updateNextMoveScores', () => {
    it('should update next action scores based on experience', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1],
        actionState: [2],
        driveState: [3]
      });

      Math.seedrandom('hello.');
      patternRecognizer.createActionsTableIfNoneExists('pattern_1_2_3').then(() => {
        patternRecognizer.initializeAllPossibleActions([[-1, 1], ['a', 'b'], ['x', 'y']]).then(() => {

          patternRecognizer.updateNextMoveScores('-1_a_x', [10])
            .then((result) => {
              const expectedScore = 0.2702702702702703;
              expect(result).to.equal(expectedScore);
              // get the updated move score from table
              // const expectedScore = (0.3684589274859717 * 9 + 10) / 10;
              // hard-coding for now until I make random number generation less brittle

              knex.column('next_action', 'score')
                .select('score', 'next_action')
                .from('pattern_1_2_3')
                .where('next_action', '-1_a_x')
                .andWhere('time_period', 0)
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

    it('should update next move score for every time period passed in', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1],
        actionState: [2],
        driveState: [3]
      });

      Math.seedrandom('hello.');
      patternRecognizer.createActionsTableIfNoneExists('pattern_1_2_3').then(() => {
        patternRecognizer.initializeAllPossibleActions([[-1, 1], ['a', 'b'], ['x', 'y']]).then(() => {

          patternRecognizer.updateNextMoveScores('-1_a_x', [10, 5, 2, 4])
            .then((result) => {
              const expectedScore = 0.2702702702702703;
              expect(result).to.equal(0.2702702702702703);

              // get the updated move score from table
              knex.column('next_action', 'score')
                .select('score', 'next_action')
                .from('pattern_1_2_3')
                .where('next_action', '-1_a_x')
                .then((results) => {
                  // should return 4 results, one for each time period
                  expect(results.length).to.equal(4);
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

          patternRecognizer.updateNextMoveScores('-1_a_x', [10])
            .then((result) => {
              expect(result).to.equal(0.2702702702702703);

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

  // TODO: re-implement after rubber banding algorithm solidifies
  describe.skip('rubberBandActionScores', () => {
    it('should throw an error if both parameters are not numbers', () => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1],
        actionState: [2],
        driveState: [3]
      });

      expect(patternRecognizer.rubberBandActionScores.bind(patternRecognizer)).to.throw();
      expect(patternRecognizer.rubberBandActionScores.bind(patternRecognizer, 1)).to.throw();
      expect(patternRecognizer.rubberBandActionScores.bind(patternRecognizer, 1, 'a')).to.throw();
    });

    it('should apply an algorithm to pull all scores towards a target score', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1],
        actionState: [2],
        driveState: [3]
      });

      patternRecognizer.createPointsTableIfNoneExists().then(
      patternRecognizer.addPointToPointsTable()).then(
      patternRecognizer.createActionsTableIfNoneExists('pattern_1_2_3')).then(() => {
        patternRecognizer.initializeAllPossibleActions([[1], [2], [3]]).then(() => {
          return patternRecognizer.rubberBandActionScores(2, 1);
        }).then(() => {
          knex.select('score').from('pattern_1_2_3').then((result) => {
            // should equal 0.3333333333333333, or the original value times
            // first param, plus second param, divided by first param plus one.
            expect(result[0].score).to.equal(((0 * 2) + 1) / 3);
            done();
          });
        });

      });
    });

    it('should change the pull of rubber banding based on config rubberBanding.dampeningValue', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1],
        actionState: [2],
        driveState: [3]
      });
      const dampening = 5;
      const target = 2;

      patternRecognizer.createPointsTableIfNoneExists().then(
      patternRecognizer.addPointToPointsTable()).then(
      patternRecognizer.createActionsTableIfNoneExists('pattern_1_2_3')).then(() => {
        patternRecognizer.initializeAllPossibleActions([[1], [2], [3]]).then(() => {
          return patternRecognizer.rubberBandActionScores(dampening, target);
        }).then(() => {
          knex.select('score').from('pattern_1_2_3').then((result) => {
            expect(result[0].score).to.equal(((0 * dampening) + target) / (dampening + 1));
            done();
          });
        });
      });
    });

    it('should change target score based on config rubberBanding.targetScore', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1],
        actionState: [2],
        driveState: [3]
      });
      const dampening = 5;
      const target = 4;

      patternRecognizer.createPointsTableIfNoneExists().then(
      patternRecognizer.addPointToPointsTable()).then(
      patternRecognizer.createActionsTableIfNoneExists('pattern_1_2_3')).then(() => {
        patternRecognizer.initializeAllPossibleActions([[1], [2], [3]]).then(() => {
          return patternRecognizer.rubberBandActionScores(dampening, target);
        }).then(() => {
          knex.select('score').from('pattern_1_2_3').then((result) => {
            expect(result[0].score).to.equal(((0 * dampening) + target) / (dampening + 1));
            done();
          });
        });
      });
    });

    it('should decay scores above threshold based on decay param', (done) => {

    });
  });

  describe('copyActionsTable', () => {
    it(`should create an actions table for the PatternRecognizer that is an
        exact copy of the actions table name passed as a param `, (done) => {

      const originalPatternRecognizer = new PatternRecognizer({
        inputState: [1],
        actionState: [2],
        driveState: [3]
      });

      const patternRecognizerCopy = new PatternRecognizer({
        inputState: [4],
        actionState: [5],
        driveState: [6]        
      });

      originalPatternRecognizer.createActionsTableIfNoneExists('pattern_1_2_3').then(
      () => originalPatternRecognizer.initializeAllPossibleActions([[0, 1], [2, 3]])).then( 
      () => patternRecognizerCopy.createActionsTableIfNoneExists('pattern_4_5_6')).then(
      () => patternRecognizerCopy.copyActionsTable('pattern_1_2_3')).then((result) => {
        // should copy over four rows to new table
        expect(result[0].affectedRows).to.equal(4);
        return Promise.all([
          knex.select().from(originalPatternRecognizer.patternToString()),
          knex.select().from(patternRecognizerCopy.patternToString())
        ]);
      }).then((results) => {
        // get rid of extra array wrapper
        const originalPatternRecognizerResults = results[0];
        const patternRecognizerCopyResults = results[1];

        expect(originalPatternRecognizerResults.length).to.equal(4);
        expect(patternRecognizerCopyResults.length).to.equal(4);
        // make sure the contents of the original table and the new table are identical.
        expect(_(originalPatternRecognizerResults).differenceWith(patternRecognizerCopyResults, _.isEqual).isEmpty())
          .to.equal(true);
        
        done();
      });

    });

  });

  describe('addPatternToExistingActionsTables', () => {
    it(`should add a new pattern row to all existing actions tables that is
        a copy of the contents of the pattern name passed in as a param`, (done) => {

      const patternRecognizer = new PatternRecognizer({
        inputState: [1],
        actionState: [2],
        driveState: [4]
      });

      const patternRecognizerCopy = new PatternRecognizer({
        inputState: [10],
        actionState: [11],
        driveState: [12]        
      });

      patternRecognizer.initializeTables([[2, 3]]).then(() =>
      patternRecognizerCopy.addPatternToExistingActionsTables(
        [patternRecognizer.patternToString()],
        patternRecognizer.actionPatternToString()
      )).then((results) => {
        expect(results[0][0].affectedRows).to.equal(1);
        // get the original and copied row out of the table it was copied into
        return Promise.all([
          knex.select('next_action', 'score').table(patternRecognizer.patternToString()).where(
          'next_action', '2'),
          knex.select('next_action', 'score').table(patternRecognizer.patternToString()).where(
          'next_action', '11'),
        ]);
      }).then((result) => {
        const originalResult = (_.flatten(result)[0]);
        const copyResult = (_.flatten(result)[1]);

        // Ensure that the copied row has an identical score to the row it was
        // copied from.
        expect(originalResult.next_action).to.equal('2');
        expect(copyResult.next_action).to.equal('11');
        expect(originalResult.score).to.equal(copyResult.score);
        done();
      });

      
    });
  });
});
