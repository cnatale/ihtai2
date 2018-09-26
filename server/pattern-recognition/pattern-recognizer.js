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
// TODO: move all command line argument processing to main.js
const argv = require('minimist')(process.argv);

class PatternRecognizer {
  /**
    @param nDimensionalPoint {object} Has inputState, actionState, and driveState properties, all of which
    are arrays. Must follow nDimensionalPointSchema.
  */
  constructor(nDimensionalPoint) {
    // temporarily disabling until schema solidifies
    // const nDimensionalPointValidation = nDimensionalPointSchema.validate(nDimensionalPoint);
    // if (nDimensionalPointValidation.error !== null) {
    //   throw nDimensionalPointValidation;
    // }

    this.setPattern(nDimensionalPoint);
  }

  setPattern(nDimensionalPoint) {
    this.pattern = nDimensionalPoint;
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

  createActionsTableIfNoneExists(tableName) {
    return knex.schema.createTableIfNotExists(tableName, function(table) {
      // table.string('id').primary();
      table.string('next_action');
      table.double('score');
      table.integer('time_period').unsigned();
      table.bigInteger('update_count').unsigned().defaultTo(0);
      table.unique(['next_action', 'time_period'], 'id');
    }).then(() => {
      return true;
    }).catch((error) => {
      if (error.message.includes('ER_TABLE_EXISTS_ERROR')) {
        console.log(`createActionsTableIfNoneExists: Table ${tableName} already exists.`);
        return true;
      }
      if (error.message.includes('ER_DUP_KEYNAME')) {
        console.log(`createActionsTableIfNoneExists: Duplicate key name in ${tableName}`);
        return true;
      }

      console.log(error);
      return false;
    });
  }

  createPointsTableIfNoneExists() {
    const globalPointsTableName = config.get('db').globalPointsTableName;
    const _this = this;

    return knex.schema.createTableIfNotExists(globalPointsTableName, function(table) {
      table.increments('id').primary();
      table.string('point');
      table.bigInteger('update_count').unsigned();
      table.dateTime('update_count_last_reset');
      _this.getPatternAsSingleArray().map((value, index) => {
        if (typeof value === 'number') {
          table.double(`point_index_${index}`);
        } else { table.string(`point_index_${index}`); }
      });
      table.integer('first_action_index');
      table.integer('first_drive_index');
    }).catch((error) => {
      if (error.message.includes('ER_TABLE_EXISTS_ERROR')) { return true; }
      console.log(error);
      return false;
    })
    .then(() => {
      return true;
    })
  }

  /**
  Create a row in Pattern Recognizer's actions table for each possible action.
  Only initializes for shortest time period. Other time periods are
  added as experienced.

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

  // Only initialize for shortest time period. Add time periods
  // dynamically later as sliding window populates them with data.
  initializeAllPossibleActions(possibleActions) {
    const actionsTableName = this.patternToString();

    const allPossibleActions = patternRecUtil.cartesianProduct(possibleActions);
    const rowsToInsert = allPossibleActions.map((val) => {
      const score = 0;
      return { next_action: val, score, time_period: 0, update_count: 0 };
    });

    // Only add actions columns if they aren't already in the table.
    // Otherwise return true and take no action.
    return knex(actionsTableName).count('*').then((result) => {
      return result[0]['count(*)'] === allPossibleActions.length ?
        true : knex(actionsTableName).insert(rowsToInsert);
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

    contentToInsert.first_action_index = this.pattern.inputState.length;
    contentToInsert.first_drive_index = this.pattern.inputState.length + this.pattern.actionState.length;

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
        },
        (error) => {
          if (error.message.includes('ER_NO_SUCH_TABLE')) { return true; }
          console.log(error);
          return false;
        });
      });
    });
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
    return knex.raw(
      `CREATE TABLE IF NOT EXISTS
      \`${this.patternToString()}\` LIKE \`${originalPatternRecognizerString}\``)
      .then(() =>
      knex.raw(`INSERT INTO \`${this.patternToString()}\` (next_action, score, time_period, update_count)
        SELECT next_action, score, time_period, 0 FROM \`${originalPatternRecognizerString}\``));
  }

  /*
    Adds the current instance's pattern to all action tables which are listed in the first param array.
    Does this by copying the scores of pattern that is being split from the table (actionPatternToSplitFrom).

    @param originalPatternRecognizerStrings {array} a list of PatternRecognizer name strings,
    which has its row in each actions table copied into the calling PatternRecognizer's
    row.

    @param actionPatternToSplitFrom {string} name of action point to copy score from, of form
      'x_y_...n'

    @returns {array} a promise which is fulfilled when all inserts are complete;
  */

  addPatternToExistingActionsTables(originalPatternRecognizerStrings, actionPatternToSplitFrom) {
    // '${this.actionPatternToString()}' was where select... next_action was
    // used to be a final line:  AND next_action <> '${this.actionPatternToString()}'
    // id should be an action/time_period combo

    return Promise.all(
      originalPatternRecognizerStrings.map((originalPatternRecognizerString) => 
        knex.raw(`INSERT IGNORE INTO \`${originalPatternRecognizerString}\` (next_action, score, time_period)
          SELECT '${this.actionPatternToString()}', score, time_period
          FROM \`${originalPatternRecognizerString}\`
          WHERE next_action = '${actionPatternToSplitFrom}'`))
    ).then((result) => {
      return result;
    }).catch((error) => {
      console.log(error);
      return error;
    });
  }

  removePatternFromExistingActionsTables(originalPatternRecognizerStrings, patternToRemove) {
    return Promise.all(originalPatternRecognizerStrings.map((originalPatternRecognizerString) =>
    knex.raw(`DELETE FROM \`${originalPatternRecognizerString}\`
      WHERE  next_action = '${patternToRemove}'`)));    
  }

  patternToString() {
    return `pattern_${this.pattern.inputState.join('_')}_${this.pattern.actionState.join('_')}_${this.pattern.driveState.join('_')}`.replace(/\./g, '+');
  }

  static patternToString(pattern) {
    return `pattern_${pattern.inputState.join('_')}_${pattern.actionState.join('_')}_${pattern.driveState.join('_')}`.replace(/\./g, '+');
  }

  getPatternAsSingleArray() {
    return [].concat(this.pattern.inputState).concat(this.pattern.actionState).concat(this.pattern.driveState);
  }

  /**
    @returns {array} an n-dimensional array representing the action state
  */
  getActionState() {
    return this.pattern.actionState;
  }

  actionPatternToString() {
    return `${this.pattern.actionState.join('_')}`.replace(/\./g, '+');
  }

  /**
    Used to create uid's in action tables for action/time_period combos.
    @param actionString {String} string representation of action state.
    @param timePeriod {Number} the time period index.

    @returns {String} a string representation of the action string/time period combination.
  */
  actionTimePeriodComboToString(actionString, timePeriod) {
    if (typeof actionString !== 'string') {
      throw (new Error('param actionString must be a String!'));
    } else if (typeof timePeriod !== 'number') {
      throw (new Error('param timePeriod must be a Number!'));
    }

    return `${actionString}+${timePeriod}`;
  }

  /**
    Drops actions table with name string given by this pattern recognizer's patternToString method
  */
  dropActionsTable() {
    return knex.schema.dropTable(this.patternToString());
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

    return knex(actionsTableName)
      .orderBy('score')
      .orderBy('time_period')
      .limit(1)
      .then((res) => res[0]);
  }

  /**
    Get list of all next actions and their scores, for diagnostic purposes.

    @return {object} List of all next actions and their scores. Order not guaranteed.
  */
  getNextActionScores() {
    return knex.column('next_action', 'score', 'time_period').select().from(this.patternToString());
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

          // const updatesPerMinute = timeDelta > 0 ? results[0].update_count / timeDelta : 0;
          const updatesPerMinute = results[0].update_count;

          resolve(updatesPerMinute);
        }, (message) => {
          reject(message);
        });
    });   
  }

  /**
    Reweights the scores in next moves db table

    @param nextActionKey {String}
    @param scores {Array of Numbers} The scores to update with.
      Each index is implicitly the time_period stream value

    @returns {Promise resolving to Number} A Promise which resolves to the best available action's score.
  */
  // TODO: needs to update all scores, change 'score' to 'scores' array
  // should probably be array of objects, with each object containing
  // a score and time_period. Or just increment time_periods for each index.
  // Also should update all scores that can be updated in sliding window.

  updateNextMoveScores(nextActionKey, scores, totalCycles) {
    /*
    Steps:
      -query actions table to get current score for nextMove key
      -do a weighted avg calculation to update score
      -save updated score to db 
    */

    const patternString = this.patternToString();
    // let originalScoreWeight = argv.originalScoreWeight || config.moveUpdates.originalScoreWeight;
    // BUG: totalCycles isn't in scope here. Pass as param
    // this isn't a good way to calculate b/c totalCycles resets every time the ihtai server instance closes
    // originalScoreWeight = totalCycles < 1500 * 200 ? originalScoreWeight : originalScoreWeight * 4
    return new Promise((resolve, reject) => {
      // Start by getting current score for each timePeriod stream

      // The join here provides access to the update_count for a pattern.
      // I can use this to simulate curiosity by making original score weight inversely proportional to
      // the update_count, maybe on a logarithmic scale.
      const globalPointsTableName = config.get('db').globalPointsTableName;
      const  originalScoreWeight = argv.originalScoreWeight ||
        config.moveUpdates.originalScoreWeight;

      knex.select('score', `${globalPointsTableName}.update_count as pattern_update_count`, `${patternString}.update_count as action_update_count`).from(patternString)
        .join(globalPointsTableName, `${globalPointsTableName}.point`, '=', knex.raw('?', [patternString]))
        .where('next_action', nextActionKey)
        .orderBy('time_period')
        .then((results) => {
          // I would get multiple results here if I have more than one time period in memory. Expect at least 1
          if (!results.length) {
            reject('ERROR: no rows selected matching pattern string: ' + patternString);
          }
          const bestAction = { index: 0, score: 99999999999 };

          const queries = scores.map((score, index) => {
            // If no existing score for a time_period, set to score.
            // Otherwise, update row with weighted average of current score and new score value.
            // Note: update_count must be > 0 for else result is NaN, adding one to value to account for this,
            // then adding an extra 1 so that original score weight never becomes 0.
            // Some example values: 0 => .3, 10 => ~1, 100 => ~2, 1000 => ~3, 10000 => ~4

            // value isn't used if results[index] is undefined
            const ageMultiplier = results[index] ? 1 + Math.log10(results[index].pattern_update_count + 2) * 2 : 0;
            const curiosityMultiplier = results[index] ? 1 + Math.log10(results[index].action_update_count + 2) : 0;

            const updatedScore = results[index] ?
              (results[index].score * ageMultiplier + score * curiosityMultiplier) / (ageMultiplier + 1) :
              score;

            if (updatedScore < bestAction.score) {
              bestAction.index = index;
              bestAction.score = updatedScore;
            }

            return knex.raw(
              `INSERT INTO \`${patternString}\` (
                next_action,
                time_period,
                score)
              values (?,?,?)
                ON DUPLICATE KEY UPDATE score = ?, update_count = ?`, [
                  nextActionKey,
                  index,
                  updatedScore,
                  updatedScore,
                  results[index] ? results[index].action_update_count + 1 : 0
                ])
              .then((results) => {
                // affectedRows value of 1 indicates insertion.
                // affectedRows value of 2 indicates an update.
                // see https://dev.mysql.com/doc/refman/5.7/en/mysql-affected-rows.html
                if (results[0].affectedRows !== 1 && results[0].affectedRows !== 2) {
                  reject('ERROR: no rows affected by score update');
                }

                // before resolving, increment update_count in patternRecognizer's globalPointsTable row
                const globalPointsTableName = config.get('db').globalPointsTableName;
                return knex(globalPointsTableName)
                  .increment('update_count', 1)
                  .where('point', '=', patternString);
              });
          });

          Promise.all(queries).then(() => {
            resolve(bestAction.score);
          });
        });
    });
  }

  /**
    Pulls all action scores for a PatternRecognizer towards a target score.
   */
  rubberBandActionScores(targetScore, decay) {
    if (isNaN(targetScore) || isNaN(decay)) {
      throw new Error('Error: all parameters must be numbers!');
    }
    // TODO: think about varying decay rate based on number of times a pattern has been
    // accessed to simulate curiosity. Patterns accessed less often get a higher decay rate.

    // TODO: if i'm updating all scores in a table, i don't think i need
    // the inner select statements, or the WHERE for that matter
    const patternTableName = this.patternToString();
    return knex.raw(
      `UPDATE \`${patternTableName}\`
       SET \`score\` = if(\`score\` <= ${targetScore}, \`score\`, \`score\` - ${decay})
       WHERE \`next_action\` IN
       (
         SELECT \`next_action\` FROM
         (
           SELECT \`next_action\`
           FROM \`${patternTableName}\`
           WHERE \`next_action\` = \`next_action\`
         ) as \`tmp\`
       )`
    );
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
