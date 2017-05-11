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
const _ = require('lodash');
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
          knex.schema.createTable(tableName, (table) => {
            table.increments('id').primary();
            table.string('next_action');
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
    /*
    To do this, I'd need a list of every possible action that could be taken. That's
    actually not so bad.
    */
    const actionsTableName = this.patternToString();

    /* TODO: create method that drills down number of dimensions action signal is
       then recursively generates a random score for every combination.
      This would be like a for (i = 0 ...) { for (j = 0 ...) { ... } } loop but for arbitrary 
      dimensionality. Do the row insertion logic once the descent reaches the last element.
    */

    // BUG: this will generate a row for every signal, not signal combination.
    // You want an n-fold Cartesian product
    /*
    [[-1,1,2,2], [2,3], [1,2,1,1,3,2,1], ... [1,2,1,3,2]]
    -this is a 2d array. info necessary to recursively determine:
    -array
    -1st dimension index
    -2nd dimension index
    [[-1,1], [-1,1]]
    */
    const outputs = [];
    function generateAllCombos(possibleActions, insertArray, firstDimIndex, secondDimIndex) {
      // iterate through all elements in first index
      if (firstDimIndex < possibleActions.length) {
        generateAllCombos(possibleActions, insertArray, firstDimIndex + 1, secondDimIndex);
      }
      if (secondDimIndex < possibleActions[firstDimIndex.length]) {
        generateAllCombos(possibleActions, insertArray, firstDimIndex, secondDimIndex + 1);
      }

      // TODO: create random score for knex row, insert into table
      // let's assume scores are from 0 - 10 for now
      // it may make sense to score fairly close to perfect score so that none
      // get completely ruled out form start.
      // TODO: Use knex(tablname).insert() with an array of objects, so this look should
      // append to an array, and then after the loop runs do the insert with array.

      /*
      insertArray should store a stack of indices, and then generate 0's for rest of 
      indices in list
      */

      
      insertArray.push(secondDimIndex);
      const fillerArr = [];
      for (let i = 0; i < (possibleActions.length - insertArray.length); i++) {
        fillerArr.push(0);
      }

      outputs.push = {
        next_action: insertArray.join('_') + fillerArr.length ? ('_' + fillerArr.join('_')) : '',
        score: Math.random() * 5
      };
      return insertArray;
    }

    const rowsToInsert = generateAllCombos(possibleActions, [], 0, 0); // should return array of insertions
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
  reweight(slidingWindow) {
    // look at logic i'm using in ihtai 1, can probably be similar

  }
}

module.exports = PatternRecognizer;
