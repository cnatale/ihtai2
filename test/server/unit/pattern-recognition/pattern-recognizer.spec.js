// test creation, functionality of individual pattern recognizers
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const knex = require('../../../../server/db/knex');
chai.use(chaiAsPromised);
const expect = chai.expect;
const PatternRecognizer = require('../../../../server/pattern-recognition/pattern-recognizer');
const config = require('config');
const log = require('../../../../log');

describe('patternRecognizer', () => {
  afterEach(function() {
    // TODO: clear all tables after every test
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

  describe('initializeAllPossibleAction', () => {
    it('should add fields for all possible actions in patternRecognizer\'s actionsTable', () => {

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
    it('should add a patternRecognizer\'s n dimensional point to points table', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1, 2],
        actionState: [3, 4],
        driveState: [5, 6]
      });

      const globalPointsTableName = config.get('db').globalPointsTableName;

      patternRecognizer.initializeTables().then(() => {
        patternRecognizer.createPointsTableIfNoneExists().then(() => {
          patternRecognizer.addPointToPointsTable().then(() => {
            knex(globalPointsTableName).select().where('point', '=', patternRecognizer.patternToString()).then((results) => {
              expect(results).to.be.an('array').and.to.not.be.empty;
              done();
            });
          });
        });
      });
    });
  });

  describe('_removePointFromPointsTable', () => {
    it('should remove the patternRecognizer point from the points table', (done) => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1, 2],
        actionState: [3, 4],
        driveState: [5, 6]
      });

      patternRecognizer.initializeTables().then(() => {
        patternRecognizer.createPointsTableIfNoneExists().then(() => {
          patternRecognizer.addPointToPointsTable().then(() => {
            patternRecognizer._removePointFromPointsTable().then((result) => {
              // result is the number of rows affected; should be at least 1
              expect(result).to.be.a('number').and.to.be.above(0);
              done();
            });
          });
        });
      });

    });
  });


  it('should delete a patternRecognizer', () => {
    // probably should be integration test since it'll involve db
  });

  it('should return its next action with lowest score', () => {
    // probably should be integration test since it'll involve db
  });

  it('should provide access to all next actions scores', () => {
    // probably should be integration test since it'll involve db
  });

  it('should update next action scores based on experience', () => {
    // probably should be integration test since it'll involve db
  });
});
