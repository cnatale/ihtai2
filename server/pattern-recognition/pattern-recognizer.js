// Individual pattern recognizer
/* A point in n-dimensional space representing:
  -input state
  -action state
  -drive state
  ...each of which is its own unique or same-dimensional sub-space

  -holds a ref to db table containing n-dimensional number which represents its pattern
  -holds ref to a db table containing all possible state combinations an Ihtai instance could access
   from the current state. This is used to decide the next action to take.
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
const patternRecUtil = require('./util');
const moment = require('moment');
const { nDimensionalPointSchema } = require('../schemas/schemas');

class PatternRecognizer {
  /**
    @param nDimensionalPoint {object} Has inputState, actionState, and driveState properties, all of which
    are arrays. Must follow nDimensionalPointSchema.
  */
  constructor(nDimensionalPoint) {
    const nDimensionalPointValidation = nDimensionalPointSchema.validate(nDimensionalPoint);
    if (nDimensionalPointValidation.error !== null) {
      throw nDimensionalPointValidation;
    }

    this.setPattern(nDimensionalPoint);
  }

  setPattern(nDimensionalPoint) {
    this.pattern = nDimensionalPoint;
  }

  /*
    Copies the actions table of an existing PatternRecognizer. Creates a new table
    named after this PatternRecognizer instance, but that is an exact duplicate of
    the one tied to the originalPatternRecognizer instance.

    @param originalPatternRecognizer {object} a PatternRecognizer that will have
      its actions db table duplicated for this PatternRecognizer instance

    @returns {array} an array containing the raw mysql response
  */
  copyActionsTable(originalPatternRecognizerString) {
    // create table using same schema as original pattern recognizer's table
    return knex.raw(`CREATE TABLE IF NOT EXISTS \`${this.patternToString()}\` LIKE \`${originalPatternRecognizerString}\``).then(() => knex.raw(`
      INSERT INTO \`${this.patternToString()}\` (next_action, score)
      SELECT next_action, score FROM \`${originalPatternRecognizerString}\``));
  }

  /*
    Adds the current instance's pattern to all existing tables.

    @param originalPatternRecognizerStrings {array} a list of PatternRecognizer strings, 
    which has its row in each actions table copied into the calling PatternRecognizer's
    row.

    @param patternToSplitFrom {string} name of action point to copy score from, of form
      'x_y_...n'

    @returns {array} a promise which is fulfilled when all inserts are complete;
  */
  addPatternToExistingActionsTables(originalPatternRecognizerStrings, patternToSplitFrom) {
    return Promise.all(originalPatternRecognizerStrings.map((originalPatternRecognizerString) =>
    knex.raw(`INSERT INTO \`${originalPatternRecognizerString}\` (next_action, score)
      SELECT '${this.actionPatternToString()}', score
      FROM \`${originalPatternRecognizerString}\`
      WHERE  next_action = '${patternToSplitFrom}'`)));
  }

  removePatternFromExistingActionsTables(originalPatternRecognizerStrings, patternToRemove) {
    return Promise.all(originalPatternRecognizerStrings.map((originalPatternRecognizerString) =>
    knex.raw(`DELETE FROM \`${originalPatternRecognizerString}\`
      WHERE  next_action = '${patternToRemove}'`)));    
  }

  initializeTables(possibleActions) {
    const tableName = this.patternToString();

    return new Promise((resolve, reject) => {
      Promise.all([
        this.createActionsTableIfNoneExists(tableName),
        this.createPointsTableIfNoneExists()
      ]).then(() => {
        // these need to wait until we're sure tables exist
        Promise.all([
          this.initializeAllPossibleActions(possibleActions),
          this.addPointToPointsTable()
        ]).then((result) => {
          resolve(result);
        }, (message) => {
          reject(message);
        });
      }).catch((message) => {
        // either createActionsTable or createPointsTable was rejected
        reject(message);
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

  getActionState() {
    return this.pattern.actionState;
  }

  actionPatternToString() {
    return this.pattern.actionState.join('_');
  }

  createActionsTableIfNoneExists(tableName) {
    return knex.schema.createTableIfNotExists(tableName, (table) => {
      table.increments();
      table.string('next_action'); // .primary();
      table.double('score'); // .index();
      // table.timestamps();
    }).then(() => {
      return true;
    }, (message) => {
      throw (new Error(message));
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

    // only add actions columns if they aren't already in the table
    return knex(actionsTableName).count('*').then(result => {
      return result[0]['count(*)'] === allPossibleActions.length ?
        true : knex(actionsTableName).insert(rowsToInsert)
    });
  }

  /**
    Drops actions table with name string given by this pattern recognizer's patternToString method
  */
  dropActionsTable() {
    return knex.schema.dropTable(this.patternToString());
  }

  createPointsTableIfNoneExists() {
    const globalPointsTableName = config.get('db').globalPointsTableName;

    return knex.schema.createTableIfNotExists(globalPointsTableName, (table) => {
      table.increments('id').primary();
      table.string('point');
      table.bigInteger('update_count').unsigned();
      table.dateTime('update_count_last_reset');
      this.getPatternAsSingleArray().map((value, index) => {
        if (typeof value === 'number') {
          table.double(`point_index_${index}`);
        } else { table.string(`point_index_${index}`); }
      });
    }).then(() => {
      return Promise.resolve(true);
    }, (message) => {
      throw (new Error(message));
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

    return new Promise((resolve, reject) => {
      this.createPointsTableIfNoneExists().then(() => {
        const globalPointsTableName = config.get('db').globalPointsTableName;

        // make sure there isn't already a row for this point in global points table
        knex(globalPointsTableName).select().where('point', this.patternToString()).then((results) => {
          if (results.length === 0) {
            return knex(globalPointsTableName).insert([contentToInsert])
              .then((results) => {
                resolve(results);
              }, (message) => {
                reject(message);
              });
          } else { resolve(results); }
        });

      });
    });
  }

  removePointFromPointsTable() {
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

  getUpdatesPerMinute() {
    const globalPointsTableName = config.get('db').globalPointsTableName;
    const patternString = this.patternToString();



    return new Promise((resolve, reject) => {
      knex.select('update_count', 'update_count_last_reset')
        .from(globalPointsTableName)
        .where('point', '=', patternString)
        .then((results) => {
          // equation: updates/min = (update_count) / (currentTime - update_count_last_reset) 
          const currentTime = moment();
          const updateCountLastReset = moment(results.update_count_last_reset)
            .format('YYYY-MM-DD HH:mm:ss');

          const timeDelta = currentTime.diff(updateCountLastReset, 'minutes');

          const updatesPerMinute = timeDelta > 0 ? results[0].update_count / timeDelta : 0;
          // const updatesPerMinute = results[0].update_count;

          resolve(updatesPerMinute);
        }, (message) => {
          reject(message);
        });
    });   
  }

  /**
    Reweights the scores in next moves db table
  */
  updateNextMoveScore(nextActionKey, score) {
    /*
    Steps:
      -query actions table to get current score for nextMove key
      -do a weighted avg calculation to update score
      -save updated score to db 
    */

    const patternString = this.patternToString();

    return new Promise((resolve, reject) => {
      knex.select('score').from(patternString)
        .where('next_action', nextActionKey)
        .then((results) => {
          if (!results.length) {
            reject('ERROR: no rows selected matching pattern string: ' + patternString);
          }
          // Update row with weighted average of current score and new score value.
          // Right now hardcoding new score to be weighted at 10% of current score
          // for updated value.
          const updatedScore = (results[0].score * 9 + score) / 10;
          // const updatedScore = (results[0].score + score) / 2;
          knex(patternString)
            .where('next_action', nextActionKey)
            .update('score', updatedScore)
            .then((numberOfRowsUpdated) => {
              if (!numberOfRowsUpdated) {
                reject('ERROR: no rows affected by score update');
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

  resetUpdateCount() {
    const globalPointsTableName = config.get('db').globalPointsTableName;

    return knex(globalPointsTableName).update({
      update_count: 0,
      update_count_last_reset: moment().format('YYYY-MM-DD HH:mm:ss')
    }).where('point', this.patternToString());
  }
}

module.exports = PatternRecognizer;
