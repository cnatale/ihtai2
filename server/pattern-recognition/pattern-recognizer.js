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


  Instantiation: pass in an n-dimensional point object. This object has the following properties:
    -inputState array
    -actionState array
    -driveState array
*/

const when = require('when');
const knex = require('../db/knex');
const config = require('config');
const log = require('../../log');

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

  _initializeTables() {
    const tableName = this.patternToString();

    // TODO: return a when.all of all the promises that need to complete
    // add to global lookup table

    // create db table holding all possible next moves/scores

    this.createActionsTableIfNoneExists(tableName).then(() => {
      // TODO: add random scores to every possible next action
    });

    // TODO: add pattern to table of all pattern recognizer ids    
  }

  patternToString() {
    return `pattern_${this.pattern.inputState.join('_')}_${this.pattern.actionState.join('_')}_${this.pattern.driveState.join('_')}`;
  }

  createActionsTableIfNoneExists(tableName) {
    return new Promise((resolve) => {
      knex.schema.hasTable(tableName).then((exists) => {
        if (!exists) {
          knex.schema.createTable(tableName, (table) => {
            table.increments('id').primary();
            table.string('next_action');
            table.double('score');
            table.timestamps();
          }).then(() => {
            resolve();
          });
        } else {
          resolve();
        }
      }, () => {
        knex.schema.createTable(tableName, (table) => {
          table.increments('id').primary();
          table.string('next_action');
          table.double('score');
          table.timestamps();
        }).then(() => {
          resolve();
        });
      });

    });
  }

  initializeAllPossibleActions() {

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
    // TODO: query db for lowest drive score 
  }

  /**
    Get list of all next actions and their scores, for diagnostic purposes.

    @return {object} List of all next actions and their scores. Order not guaranteed.
  */
  getNextActionScores() {

  }


  /**
    Reweights the scores in next moves db table
    @param slidingWindow (Object) Slding window of stimesteps.
  */
  reweight(slidingWindow) {


  }
}

module.exports = PatternRecognizer;
