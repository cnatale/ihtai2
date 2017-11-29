// Individual pattern recognizer
/* A point in n-dimensional space representing:
  -input state
  -action state
  -drive state
  ...each of which is its own n-dimensional number

  -holds a ref to db table containing n-dimensional number which represents its pattern
  -holds ref to a db table containing all possible action combinations an Ihtai instance could take. 
    -start by randomly weighting them all
    -score is based on the avg of drive scores over whatever the time period is.
    -if time period sliding window isn’t full, skip reweighting
  -has method to get next action with lowest score from db table
  -handles all database communication


  Instantiation: pass in an n-dimensional point object. This object has the following properties:
    -inputState array
    -actionState array
    -driveState array
*/

const knex = require('../db/knex');
const config = require('config');
// const log = require('../../log');
const patternRecUtil = require('./util');
const moment = require('moment');

class PatternRecognizer {
  /**
    @param nDimensionalPoint {object} Has inputState, actionState, and driveState properties, all of which
    are arrays.
  */
  constructor(nDimensionalPoint) {
    this.setPattern(nDimensionalPoint);
  }

  setPattern(nDimensionalPoint) {
    this.pattern = nDimensionalPoint;
  }

  initializeTables(possibleActions) {
    const tableName = this.patternToString();

    return new Promise((resolve) => {
      Promise.all([
        this.createActionsTableIfNoneExists(tableName),
        this.createPointsTableIfNoneExists()
      ]).then(() => {
        Promise.all([
          this.initializeAllPossibleActions(possibleActions),
          this.addPointToPointsTable()
        ]).then((result) => {
          resolve(result);
        });
      });
    });
  }

  patternToString() {
    return `pattern_${this.pattern.inputState.join('_')}_${this.pattern.actionState.join('_')}_${this.pattern.driveState.join('_')}`;
  }

  static patternToString(pattern) {
    return `pattern_${pattern.inputState.join('_')}_${pattern.actionState.join('_')}_${pattern.driveState.join('_')}`;
  }

  getPatternAsSingleArray() {
    return [].concat(this.pattern.inputState).concat(this.pattern.actionState).concat(this.pattern.driveState);
  }

  createActionsTableIfNoneExists(tableName) {
    return new Promise((resolve) => {
      knex.schema.hasTable(tableName).then((exists) => {
        if (!exists) {
          // TODO: create common wrapper function for this and identical logic below
          knex.schema.createTable(tableName, (table) => {
            table.string('next_action').primary();
            table.double('score').index();
            table.timestamps();
          }).then(() => {
            resolve();
          });
        } else {
          resolve();
        }
      }, () => {
        knex.schema.createTable(tableName, (table) => {
          table.string('next_action').primary();
          table.double('score').index();
          table.timestamps();
        }).then(() => {
          resolve();
        });
      });

    });
  }

  /**
  Creates random weights for each possible next move combination.

  @param possibleActions {object} Has the following format:
  {
    [
      [possible actions for index 0],
      [possible actions for index 1],
      ...
      [possible actions for index n]
    ]

    ex: [[-1, 0, 1], [1, 2, 3], ... [-1, 1]]
  }
  */
  initializeAllPossibleActions(possibleActions) {
    const actionsTableName = this.patternToString();

    const allPossibleActions = patternRecUtil.cartesianProduct(possibleActions);
    const rowsToInsert = allPossibleActions.map((val) => {
      const score = Math.random();
      return { next_action: val, score };
    });
    return knex(actionsTableName).insert(rowsToInsert);
  }

  /**
    Drops actions table with name string given by this pattern recognizer's patternToString method
  */
  dropActionsTable() {
    return new Promise((resolve) => {
      knex.schema.dropTable(this.patternToString()).then(() => {
        resolve(true);
      }, () => { resolve(false); });
    });
  }

  createPointsTableIfNoneExists() {
    const globalPointsTableName = config.get('db').globalPointsTableName;

    return new Promise((resolve) => {
      knex.schema.hasTable(globalPointsTableName).then((exists) => {
        if (!exists) {
          knex.schema.createTable(globalPointsTableName, (table) => {
            table.increments('id').primary();
            table.string('point');
            table.bigInteger('update_count').unsigned();
            table.dateTime('update_count_last_reset');
            this.getPatternAsSingleArray().map((value, index) => {
              if (typeof value === 'number') {
                table.double(`point_index_${index}`);
              } else { table.string(`point_index_${index}`); }
            });

          }).then((result) => {
            resolve(result);
          });
        } else {
          resolve();
        }
      }, () => {
        resolve(); // should still be considered successful if promise is rejected due to knex weirdness
      });
    });
  }


  /**
  Adds this PatternRecognizer's n-dimensional point to the globalPointsTable
  */
  addPointToPointsTable() {
    // Create an object representing row to add to global points table.
    // Add point column, along with each point index to its own column.
    const contentToInsert = { point: this.patternToString() };
    contentToInsert.update_count = 0;
    contentToInsert.update_count_last_reset = moment().format('YYYY-MM-DD HH:mm:ss');

    this.getPatternAsSingleArray().map((signal, index) => {
      contentToInsert[`point_index_${index}`] = signal;
    });

    return new Promise((resolve) => {
      this.createPointsTableIfNoneExists().then(() => {
        const globalPointsTableName = config.get('db').globalPointsTableName;
        knex(globalPointsTableName).insert([contentToInsert])
          .then((result) => {
            resolve(result);
          });
      });
    });
  }

  removePointFromPointsTable() {
    const globalPointsTableName = config.get('db').globalPointsTableName;

    return new Promise((resolve) => {
      knex(globalPointsTableName).where(
        'point', this.patternToString()).del()
        .then((result) => {
          resolve(result);
        });
    });
  }



  /**
    Get the best action to carry out based on current state

    @return {string} the string representing next action to take
  */
  getBestNextAction() {
    const actionsTableName = this.patternToString();

    return knex(actionsTableName).orderBy('score').limit(1)
      .then((res) => res[0]);
  }

  /**
    Get list of all next actions and their scores, for diagnostic purposes.

    @return {object} List of all next actions and their scores. Order not guaranteed.
  */
  getNextActionScores() {
    return knex.column('next_action', 'score').select().from(this.patternToString());
  }


  /**
    Reweights the scores in next moves db table
  */
  updateNextMoveScore(nextMoveKey, score) {
    /*
    Steps:
      -query actions table to get current score for nextMove key
      -do a weighted avg calculation to update score
      -save updated score to db 
    */

    const patternString = this.patternToString();

    return new Promise((resolve) => {
      knex.select('score').from(patternString)
        .where('next_action', nextMoveKey)
        .then((results) => {
          // Update row with weighted average of current score and new score value.
          // Right now hardcoding new score to be weighted at 10% of current score
          // for updated value.
          const updatedScore = (results[0].score * 9 + score) / 10;
          knex(this.patternToString())
            .where('next_action', nextMoveKey)
            .update('score', updatedScore)
            .then((numberOfRowsUpdated) => {
              if (!numberOfRowsUpdated) {
                throw 'ERROR: no rows affected by score update';
              }

              // before resolving, increment update_count in patternRecognizer's globalPointsTable row
              const globalPointsTableName = config.get('db').globalPointsTableName;
              knex(globalPointsTableName)
                .increment('update_count', 1)
                .where('point', '=', patternString)
                .then(() => {
                  resolve(true);
                });
            });
        });
    });
  }

}

module.exports = PatternRecognizer;
