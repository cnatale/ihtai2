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

const when = require('when');
const knex = require('../db/knex');
const config = require('config');
const _ = require('lodash');
const log = require('../../log');
const patternRecUtil = require('./util');

class PatternRecognizer {
  /**
    @param nDimensionalPoint {object} string representing the n dimensional point the pattern represents
    Has inputState, actionState, and driveState props
  */
  constructor(nDimensionalPoint) {
    this.pattern = nDimensionalPoint;

    // all db access methods return promises
    this.initializeTables = when.lift(this._initializeTables);
    this.createPointsTableIfNoneExists = when.lift(this._createPointsTableIfNoneExists);
    this.addPointToPointsTable = when.lift(this._addPointToPointsTable);
    this.removePointFromPointsTable = when.lift(this._removePointsFromPointsTable);

  }

  // TODO: pass in possibleActions
  _initializeTables(possibleActions) {
    const tableName = this.patternToString();

    return new Promise((resolve) => {
      Promise.all([
        this.createActionsTableIfNoneExists(tableName),
        this.createPointsTableIfNoneExists()
      ]).then(() => {
        Promise.all([
          this.initializeAllPossibleActions(possibleActions),
          this.addPointToPointsTable()
        ]).then(() => {
          resolve();
        });
        
      });
    });
    // TODO: return a when.all of all the promises that need to complete
    // add to global lookup table

    // create db table holding all possible next moves/scores

    // this.createActionsTableIfNoneExists(tableName).then(() => {
      // TODO: add random scores to every possible next action
    // });

    // TODO: add pattern to table of all pattern recognizer ids    
  }

  patternToString() {
    return `pattern_${this.pattern.inputState.join('_')}_${this.pattern.actionState.join('_')}_${this.pattern.driveState.join('_')}`;
  }

  createActionsTableIfNoneExists(tableName) {
    return new Promise((resolve) => {
      knex.schema.hasTable(tableName).then((exists) => {
        if (!exists) {
          // TODO: create common wrapper function for this and logic below
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
      return { next_action: val, score: Math.random() };
    });
    return knex(actionsTableName).insert(rowsToInsert);
    
    // TODO: write tests
  }

  /**
    Drops actions table with name string given by this pattern recognizer's patternToString method
  */
  dropActionsTable() {
    return new Promise((resolve) => {
      knex.schema.dropTable(this.patternToString()).then(() => {
        resolve();
      }, () => { resolve(); });
    });
  }

  _createPointsTableIfNoneExists() {
    const globalPointsTableName = config.get('db').globalPointsTableName;

    return new Promise((resolve) => {

      knex.schema.hasTable(globalPointsTableName).then((exists) => {
        if (!exists) {
          knex.schema.createTable(globalPointsTableName, (table) => {
            table.increments('id').primary();
            table.string('point');
            table.timestamps();
          });
        }
        resolve();
      }, () => {
        resolve(); // should still be considered successful in a no-op
      });

    });
  }


  /**
  Adds this PatternRecognizer's n-dimensional point to the globalPointsTable
  */
  _addPointToPointsTable() {
    return new Promise((resolve) => {
      this.createPointsTableIfNoneExists().then(() => {
        const globalPointsTableName = config.get('db').globalPointsTableName;
        knex(globalPointsTableName).insert([
            { point: this.patternToString() }
        ]).then(() => {
          resolve();
        });
      });
    });
  }

  _removePointFromPointsTable() {
    const globalPointsTableName = config.get('db').globalPointsTableName;

    return knex(globalPointsTableName).where(
      'point', this.patternToString()).del();    
  }



  /**
    Get the best action to carry out based on current state

    @return {string} the string representing next action to take
  */
  getBestNextAction() {
    const actionsTableName = this.patternToString();

    return knex(actionsTableName).orderBy('score').limit(1);
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
    @param slidingWindow (Object) Slding window of stimesteps.
  */
  updateNextMoveScore(nextMove, score) {
    /*
    Steps:
      -query actions table to get current score for nextMove key
      -do a weighted avg calculation to update score
      -save updated score to db 
    */

    return new Promise((resolve) => {
      knex.select('score').from(this.patternToString())
        .where('next_action', nextMove)
        .then((results) => {
          console.log('******* score prior to update: ' + results[0].score + ' ********');
          // update row with weighted average of current score and new score value
          const updatedScore = (results[0].score * 9 + score) / 10;
          knex(this.patternToString())
            .where('next_action', nextMove)
            .update('score', updatedScore)
            .then((numberOfRowsUpdated) => {
              if (!numberOfRowsUpdated) {
                throw 'ERROR: no rows affected by score update';
              }
              resolve(true);
            });
        });
    });

  }
}

module.exports = PatternRecognizer;
