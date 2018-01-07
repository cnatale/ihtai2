const PatternRecognitionGroup = require('../../../../server/pattern-recognition/pattern-recognition-group');
const PatternRecognizer = require('../../../../server/pattern-recognition/pattern-recognizer');
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const knex = require('../../../../server/db/knex');
const dbUtil = require('../../../../server/db/util');
const _ = require('lodash');
const moment = require('moment');
chai.use(chaiAsPromised);
require('seedrandom');
Math.seedrandom('hello');
const config = require('config');
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);


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
          { inputState:[0], actionState: [2], driveState: [4] },
          { inputState: [1], actionState: [3], driveState: [5] }
        ],
        [[2, 3]]
      ).then((result) => {
        expect(result.length).to.equal(2);
        expect(_.every(result)).to.equal(true);
        done();
      });
    });

    it('should initialize patternRecognitionGroup and create patternRecognizers', (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [
          { inputState:[5], actionState: [5], driveState: [5] },
          { inputState: [10], actionState: [10], driveState: [10] },
          { inputState:[15], actionState: [15], driveState: [15] },
          { inputState: [20], actionState: [20], driveState: [20] }          
        ],
        [
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
        [{
          inputState: [0],
          actionState: [2],
          driveState: [4]
        }],
        [[2, 3]]
      ).then((result) => {
        expect(result).to.be.an('array').with.length(1);
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
        [{
          inputState: [0],
          actionState: [0],
          driveState: [0]
        }],
        [[0, 10]]
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

  describe('getPatternRecognizer', () => {
    it('should return a patternRecognizer object when given string key', (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [
          { inputState:[5], actionState: [5], driveState: [5] }       
        ],
        [
          [0, 5, 10, 15, 20]
        ]
      ).then(() => {
        const expectedPatternString = PatternRecognizer.patternToString(
          { inputState:[5], actionState: [5], driveState: [5] } 
        );

        const patternRecognizer = patternRecognitionGroup.
          getPatternRecognizer(expectedPatternString);

        expect(patternRecognizer).to.be.an('object');
        done();
      });
    });

    it('should throw an error if string key does not match any patternRecognizers', (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [
          { inputState:[5], actionState: [5], driveState: [5] }       
        ],
        [
          [0, 5, 10, 15, 20]
        ]
      ).then(() => {
        const expectedPatternString = 'notTheRightString';

        expect(() => patternRecognitionGroup.
          getPatternRecognizer(expectedPatternString)
        ).to.throw();   

        done();
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
          // expected result 'pattern_0_15_0'
          expect(result).to.equal('pattern_0_15_0');
        },
        (err) => {
          throw (err);
        });
      }).then(() => {
        patternRecognitionGroup.getNearestPatternRecognizer(
          { inputState: [4], actionState: [5], driveState: [4] }
        ).then((result) => {
          expect(result).to.equal('pattern_5_5_5');
        },
        (err) => {
          throw (err);
        });
      }).then(() => {
        patternRecognitionGroup.getNearestPatternRecognizer(
          { inputState: [20], actionState: [20], driveState: [20] }
        ).then((result) => {
          expect(result).to.equal('pattern_20_20_20');
        },
        (err) => {
          throw (err);
        });
      }).then(() => {
        patternRecognitionGroup.getNearestPatternRecognizer(
          { inputState: [8], actionState: [12], driveState: [9] }
        ).then((result) => {
          expect(result).to.equal('pattern_10_10_10');
          done();
        },
        (err) => {
          throw (err);
        });
      });
    });
  });

  describe('splitPatternRecognizer', () => {
    it('should split a patternRecognizer, given existing patternRecognizer and a new pattern key', (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [
          { inputState:[5], actionState: [5], driveState: [5] },
          { inputState: [10], actionState: [10], driveState: [10] },
          { inputState:[0], actionState: [15], driveState: [0] },
          { inputState: [20], actionState: [20], driveState: [20] }          
        ],
        [
          [0, 5, 10, 15, 20]
        ]
      ).then(() => patternRecognitionGroup.splitPatternRecognizer(
        'pattern_5_5_5', { inputState:[6], actionState: [6], driveState: [6] })
      ).then((result) => {
        expect(result instanceof PatternRecognizer).to.equal(true);
        done();
      });
    });

    it(`should add a patternRecognizer for new pattern to patternRecognitionGroup's patternRecognizers
        in-memory Object`, (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [
          { inputState:[5], actionState: [5], driveState: [5] },
          { inputState: [10], actionState: [10], driveState: [10] },
          { inputState:[0], actionState: [15], driveState: [0] },
          { inputState: [20], actionState: [20], driveState: [20] }          
        ],
        [
          [0, 5, 10, 15, 20]
        ]
      ).then(() => patternRecognitionGroup.splitPatternRecognizer(
        'pattern_5_5_5', { inputState:[6], actionState: [6], driveState: [6] })
      ).then(() => {
        const splitPatternRecognizer = patternRecognitionGroup.patternRecognizers['pattern_6_6_6'];
        expect(splitPatternRecognizer instanceof PatternRecognizer).to.equal(true);
        done();
      });
    });

    it('should add a new row in the global points table for new point', (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [
          { inputState:[5], actionState: [5], driveState: [5] },
          { inputState: [10], actionState: [10], driveState: [10] },
          { inputState:[0], actionState: [15], driveState: [0] },
          { inputState: [20], actionState: [20], driveState: [20] }          
        ],
        [
          [0, 5, 10, 15, 20]
        ]
      ).then(() => patternRecognitionGroup.splitPatternRecognizer(
        'pattern_5_5_5', { inputState:[6], actionState: [6], driveState: [6] })
      ).then(() => {
        const globalPointsTableName = config.get('db').globalPointsTableName;
        return knex.select('point').from(globalPointsTableName).where('point', 'pattern_6_6_6');
      }).then((result) => {
        expect(result[0].point).to.equal('pattern_6_6_6');
        done();
      });
    });

    it(`should add a new row in every existing point's actions table representing new pattern, set to
        value of pattern it is being split from`, (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [
          { inputState:[5], actionState: [5], driveState: [5] }       
        ],
        [
          [0, 5, 10, 15, 20]
        ]
      ).then(() => patternRecognitionGroup.splitPatternRecognizer(
        'pattern_5_5_5', { inputState:[6], actionState: [6], driveState: [6] })
      ).then(() => {
        return knex.select('next_action', 'score').from('pattern_5_5_5').where(
          'next_action', '5').orWhere('next_action', '6');
      }).then((result) => {
        expect(result[0].next_action).to.equal('5');
        expect(result[1].next_action).to.equal('6');
        expect(result[0].score).to.equal(result[1].score);
        done();
      });
    });

    it('should create a copy of existing pattern action table, including existing scores for each action', (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      let originalTableData, newTableData;
      patternRecognitionGroup.initialize(
        [
          { inputState:[5], actionState: [5], driveState: [5] }       
        ],
        [
          [0, 5, 10, 15, 20]
        ]
      ).then(() => patternRecognitionGroup.splitPatternRecognizer(
        'pattern_5_5_5', { inputState:[6], actionState: [6], driveState: [6] })
      ).then(() => {
        return knex.select().from('pattern_5_5_5');
      }).then((originalTableResults) => {
        expect(originalTableResults.length).to.equal(6);
        originalTableData = originalTableResults;
        return knex.select().from('pattern_6_6_6');
      }).then((newTableResults) => {
        expect(newTableResults.length).to.equal(6);
        newTableData = newTableResults;

        _.forEach(originalTableData, (value, index) => {
          expect(typeof originalTableData[index] === 'object').to.equal(true);
          expect(typeof newTableData[index] === 'object').to.equal(true);

          for (const key in originalTableData[index]) {
            if (originalTableData[index].hasOwnProperty(key)) { 
              expect(originalTableData[index][key]).to.equal(newTableData[index][key]);
            }
          }          
        });

        done();
      });
    });

    it('should reset split conditions on patternRecognizer that was split from', (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      const startingMoment = moment();
      const globalPointsTableName = config.get('db').globalPointsTableName;

      patternRecognitionGroup.initialize(
        [
          { inputState:[5], actionState: [5], driveState: [5] },
          { inputState: [10], actionState: [10], driveState: [10] },
          { inputState:[0], actionState: [15], driveState: [0] },
          { inputState: [20], actionState: [20], driveState: [20] }          
        ],
        [
          [0, 5, 10, 15, 20]
        ]
      ).then(() => {
        return knex(globalPointsTableName).update('update_count', 99).where(
          'point', 'pattern_5_5_5'
        );
      }).then(() => {
        return setTimeoutPromise(2000);
      }).then(() => patternRecognitionGroup.splitPatternRecognizer(
        'pattern_5_5_5', { inputState:[6], actionState: [6], driveState: [6] })
      ).then(() => {
        return knex.select('update_count', 'update_count_last_reset').from(
          globalPointsTableName).where('point', 'pattern_5_5_5');
      }).then((results) => {
        const result = results[0];
        expect(result.update_count).to.equal(0);
        expect(startingMoment.isBefore(moment(result.date_last_reset))).to.equal(
          true);

        done();
      });
    }).timeout(5000);

    it('should return promise that resolves to reference of the new patternRecognizer', (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [
          { inputState:[5], actionState: [5], driveState: [5] },
          { inputState: [10], actionState: [10], driveState: [10] },
          { inputState:[0], actionState: [15], driveState: [0] },
          { inputState: [20], actionState: [20], driveState: [20] }          
        ],
        [
          [0, 5, 10, 15, 20]
        ]
      ).then(() => patternRecognitionGroup.splitPatternRecognizer(
        'pattern_5_5_5', { inputState:[6], actionState: [6], driveState: [6] })
      ).then((result) => {
        expect(result instanceof PatternRecognizer).to.equal(true);
        done();
      });
    });
  });

  // TODO: priority
  describe('populateFromDb/inflate()', () => {
    it('should build a pattern-recognition-group from existing db', () => {
      // TODO: write populateFromDb() method that gets all tables and creates
      //       1 patternRecognizer instance per table inside pattern-recognition-group
      // Can get each pattern recognizer info from global points table.
      // Probably need some type of equivalent populateFromDb() method in the PatternRecognizer class
      // as well.
    });
  });

  describe('deletePatternRecognizer()', () => {
    it('should delete a patternRecognizer when passed its pattern', (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [
          { inputState:[2], actionState: [4], driveState: [6] },
          { inputState: [3], actionState: [5], driveState: [7] }
        ],
        [[4, 5]]
      ).then((result) => {
        expect(result.length).to.equal(2);
        expect(_.every(result)).to.equal(true);
        
        patternRecognitionGroup.deletePatternRecognizer('pattern_2_4_6').then((res) => {
          expect(res).to.equal(true);        
          done();
        });
      });
    });

    it('should remove pattern from global points table', (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [
          { inputState:[2], actionState: [4], driveState: [6] },
          { inputState: [3], actionState: [5], driveState: [7] }
        ],
        [[4, 5]]
      ).then(() => {
        patternRecognitionGroup.deletePatternRecognizer('pattern_2_4_6').then(() => {
          // verify pattern is removed from global points table
          knex.select().table(config.get('db').globalPointsTableName).where(
          'point', 'pattern_2_4_6').then((result) => {
            expect(result.length).to.equal(0);
            done();
          });
        });
      });
    });

    it('should remove pattern\'s actions table', (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();
      patternRecognitionGroup.initialize(
        [
          { inputState:[2], actionState: [4], driveState: [6] },
          { inputState: [3], actionState: [5], driveState: [7] }
        ],
        [[4, 5]]
      ).then(() => {
        patternRecognitionGroup.deletePatternRecognizer('pattern_2_4_6').then(() => {
          // verify pattern's actions table is removed
          knex.schema.hasTable('pattern_2_4_6').then((exists) => {
            expect(exists).to.equal(false);
            done();
          });
        });
      });
    });

    it('should remove pattern row from every other pattern\'s actions table', (done) => {
      const patternRecognitionGroup = new PatternRecognitionGroup();

      patternRecognitionGroup.initialize(
        [
          { inputState:[2], actionState: [4], driveState: [6] },
          { inputState: [3], actionState: [5], driveState: [7] }
        ],
        [[4, 5]]
      ).then(() => {
        patternRecognitionGroup.deletePatternRecognizer('pattern_2_4_6').then(() => {
          // verify pattern is removed from other action's tables
          return knex.select().table('pattern_3_5_7').where('next_action', '4');
        }).then((result) => {
          expect(result.length).to.equal(0);
          return knex.select().table('pattern_3_5_7').where('next_action', '5');
        }).then((result) => {
          expect(result.length).to.equal(1);
          done();
        });
      });
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
