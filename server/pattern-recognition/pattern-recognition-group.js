
const PatternRecognizer = require('./pattern-recognizer');
const _ = require('lodash');
const knex = require('../db/knex');
const nodeFn = require('when/node');
const memcached = require('../caching/memcached');
const config = require('config');
const Joi = require('joi');
const { nDimensionalPointSchema, nDimensionalPointsSchema } = require('../schemas/schemas');

/**
  Properties:

  patternRecognizers {Object} Each key is a string representing a stored pattern.

*/

class PatternRecognitionGroup {

  constructor() {
    this.isInitialized = false;
    this.patternRecognizers = {};
  }

  /**
    @param nDimensionalPoints {array} Initialization array of points
      used for creating child PatternRecognizers. If you don't want to initialize
      with points, pass an empty array.

      Length = inputState.length + actionState.length + driveState.length
      Ex: [{inputState: [-1], actionState: [a], driveState: [x]},
           {inputState: [0], actionState: [b], driveState: [y]},
           {inputState: [1], actionState: [c], driveState: [z]}]

    @param possibleActionValues {array} an array where each index is an array of all possible
      values for the respective action component signal.
      Ex: [[-1, 0, 1], [a, b, c], [x, y, z]]
      Length of outer array must equal number of dimensions of n-dimensional points

    @returns Array of Promises, one for each point to add.
    All resolve to true if the operation was successful.
  */
  initialize (nDimensionalPoints, possibleActionValues) {
    // dimensionality can be determined by using .length of one of the nDimensionalPoints
    const nDimensionalPointsSchemaValidation = nDimensionalPointsSchema.validate(nDimensionalPoints);
    if (nDimensionalPointsSchemaValidation.error !== null) {
      throw nDimensionalPointsSchemaValidation;
    }

    // defining schema here so it can base element length on n-dimensional points dimensionality
    const possibleActionValuesSchema =
      Joi.array().items(
        Joi.array().items(
          Joi.number()
        )
      ).length(
          nDimensionalPoints[0].actionState.length
      ); // length must equal dimensionality of actions

    const actionValuesSchemaValidation = possibleActionValuesSchema.validate(possibleActionValues);
    if (actionValuesSchemaValidation.error !== null) {
      throw actionValuesSchemaValidation;
    }

    this.possibleActionValues = possibleActionValues;

    if (nDimensionalPoints.length === 0) {
      return Promise.resolve([]);
    }

    // TODO: global points table needs created before

    this.isInitialized = true;
    // add all patternRecognizers in nDimensionalPoints list
    return Promise.all(nDimensionalPoints.map((nDimensionalPoint) => {
      return this.addPatternRecognizer(nDimensionalPoint);
    }));
  }

  /** 
    Add rows from global points table to this group's patternRecognizers list.

    @param possibleActionValues {array} an array where each index is an array of all possible
      values for the respective action component signal.
      Ex: [[-1, 0, 1], [a, b, c], [x, y, z]]
      Length of outer array must equal number of dimensions of n-dimensional points

    @returns {array} An array of booleans expressing if pattern was added to patternRecognizers list.
   */
  initializeFromDb(possibleActionValues) {
    // defining schema here so it can base element length on n-dimensional points dimensionality
    const possibleActionValuesSchema =
      Joi.array().items(
        Joi.array().items(
          Joi.number()
        )
      );

    const actionValuesSchemaValidation = possibleActionValuesSchema.validate(possibleActionValues);
    if (actionValuesSchemaValidation.error !== null) {
      throw actionValuesSchemaValidation;
    }

    this.possibleActionValues = possibleActionValues;

    const globalPointsTableName = config.get('db').globalPointsTableName;
    return knex(globalPointsTableName)
      .select('point', 'first_action_index', 'first_drive_index')
      .then((results) => {
        // turn results into an array of nDimensionalPoints
        return results.map((result) => {
          const prefixRemoved = result.point.replace('pattern_', '');
          const allPoints = prefixRemoved.split('_').map((numberString) => {
            // return parseInt(numberString, 10);
            return numberString;
          });

          // return an nDimensionalPoints object
          const nDimensionalPoint = {
            inputState: allPoints.slice(0, result.first_action_index),
            actionState: allPoints.slice(result.first_action_index, result.first_drive_index),
            driveState: allPoints.slice(result.first_drive_index)
          };
          return nDimensionalPoint;
        });
        // return an array of nDimensionalPoints representing existing points
      }, (error) => {
        console.log('Error: PatternRecognitionGroup.initializeFromDb():');
        return Promise.reject(error);
      })
      .then((nDimensionalPoints) => {
        // temporarily turn off while changing schema
        // const nDimensionalPointsSchemaValidation = nDimensionalPointsSchema.validate(nDimensionalPoints);
        // if (nDimensionalPointsSchemaValidation.error !== null) {
        //   throw nDimensionalPointsSchemaValidation;
        // }

        this.isInitialized = true;
        // add all patternRecognizers in nDimensionalPoints list
        return Promise.all(nDimensionalPoints.map((nDimensionalPoint) => {
          return this.addPatternRecognizer(nDimensionalPoint);
        }));
      });
  }

  /**
    @param nDimensionalPoint {Object} An n-dimensional point described as three
    Object properties, each containing an array of numbers.

    ex: {inputState: [-1, 2], actionState: [a], driveState: [x]}

    @returns {Promise} A promise resolving to true or false, depending on if action was successful
  */
  addPatternRecognizer (nDimensionalPoint) {
    // temporarily disabling until schema solidifies
    // const schemaValidator = nDimensionalPointSchema.validate(nDimensionalPoint);
    // if (schemaValidator.error !== null) {
    //   return Promise.reject(schemaValidator);
    // }

    if (!this.possibleActionValues) {
      return Promise.reject(new Error('PatternRecognitionGroup.addPatternRecognizer: possibleActionValues not initialized.'));
    }

    const nDimensionalPointString = PatternRecognizer.patternToString(nDimensionalPoint); 
    if (this.patternRecognizers[nDimensionalPointString]) {
      return Promise.resolve(false);
    }

    const patternRecognizer = new PatternRecognizer(nDimensionalPoint);
    this.patternRecognizers[nDimensionalPointString] = patternRecognizer;

    return new Promise((resolve, reject) => {
      // TODO: initializeTables is being rejected if tables already exist. handle this situation
      patternRecognizer.initializeTables(this.possibleActionValues).then((results) => {
        // make sure every result returns expected array of mysql table row id's
        if (!_.every(results.map((result) => {
          return (Array.isArray(result) && _.every(result, (item) => {
            // make sure each array element is a row index number
            return !isNaN(item);
          }) && results.length >= 1);
        }))) {
          reject(`Error: PatternRecognitionGroup.addPatternRecogizer(): initializeTables() failed
            on one or more PatternRecognizer`);
        }

        resolve(true);
      }, (error) => {
        reject(error);
      });
    });
  }

  /**
    Gets the in-memory patternRecognizer instance with a key equal to
    the nDimensionalPointString param

    @param nDimensionalPointString {string} takes the form of
      'pattern_a_b_c_...n-1_n'

    @returns {object} the associated patternRecognizer instance object
  */
  getPatternRecognizer(nDimensionalPointString) {
    /*
    TODO: Bug after restarting server with existing ihtai instance in db, causes server to crash
{"name":"Ihtai","hostname":"Chriss-MacBook-Pro.local","pid":4199,"level":50,"msg":"FAILURE INITIALIZING PATTERN RECOGNITION GROUP FROM DB","time":"2018-09-25T17:45:08.050Z","v":0}
{"name":"Ihtai","hostname":"Chriss-MacBook-Pro.local","pid":4199,"level":50,"err":{"message":"PatternRecognitionGroup.addPatternRecognizer: possibleActionValues not initialized.","name":"Error","stack":"Error: PatternRecognitionGroup.addPatternRecognizer: possibleActionValues not initialized.\n    at PatternRecognitionGroup.addPatternRecognizer (/Users/natale/Projects/ihtai_2.0/server/pattern-recognition/pattern-recognition-group.js:162:29)\n    at Promise.all.nDimensionalPoints.map (/Users/natale/Projects/ihtai_2.0/server/pattern-recognition/pattern-recognition-group.js:141:23)\n    at Array.map (<anonymous>)\n    at knex.select.then.then (/Users/natale/Projects/ihtai_2.0/server/pattern-recognition/pattern-recognition-group.js:140:47)\n    at tryCatcher (/Users/natale/Projects/ihtai_2.0/node_modules/bluebird/js/release/util.js:16:23)\n    at Promise._settlePromiseFromHandler (/Users/natale/Projects/ihtai_2.0/node_modules/bluebird/js/release/promise.js:512:31)\n    at Promise._settlePromise (/Users/natale/Projects/ihtai_2.0/node_modules/bluebird/js/release/promise.js:569:18)\n    at Promise._settlePromise0 (/Users/natale/Projects/ihtai_2.0/node_modules/bluebird/js/release/promise.js:614:10)\n    at Promise._settlePromises (/Users/natale/Projects/ihtai_2.0/node_modules/bluebird/js/release/promise.js:693:18)\n    at Async._drainQueue (/Users/natale/Projects/ihtai_2.0/node_modules/bluebird/js/release/async.js:133:16)\n    at Async._drainQueues (/Users/natale/Projects/ihtai_2.0/node_modules/bluebird/js/release/async.js:143:10)\n    at Immediate.Async.drainQueues [as _onImmediate] (/Users/natale/Projects/ihtai_2.0/node_modules/bluebird/js/release/async.js:17:14)\n    at runCallback (timers.js:789:20)\n    at tryOnImmediate (timers.js:751:5)\n    at processImmediate [as _immediateCallback] (timers.js:722:5)"},"msg":"PatternRecognitionGroup.addPatternRecognizer: possibleActionValues not initialized.","time":"2018-09-25T17:45:08.051Z","v":0}
Error: PatternRecognitionGroup.getPatternRecognizer():
        no patternRecognizer found matching the input string pattern_-3200_6000_-400_0_0_0_0_85

    */

    if (!this.patternRecognizers[nDimensionalPointString]) {
      throw (`Error: PatternRecognitionGroup.getPatternRecognizer(): 
        no patternRecognizer found matching the input string ${nDimensionalPointString}`);
    }

    return this.patternRecognizers[nDimensionalPointString];
  }

  /**
    TODO: This function hasn't been tested yet and probably doesn't work.
    Removes:
      -row containing point from global_points_table
      -all data from associated pattern_... table
      -pattern from all actions tables
    @param pattern {String} A string representing the pattern to delete
  */
  deletePatternRecognizer (pattern) {
    const patternRecognizer = this.patternRecognizers[pattern];

    if (typeof patternRecognizer === 'undefined') {
      throw ('Error: PatternRecognizer.deletePatternRecognizer: no matching pattern.');
    }

    return new Promise((resolve) => {
      patternRecognizer.removePatternFromExistingActionsTables(
      _.map(this.patternRecognizers, (patternRecognizer) => patternRecognizer.patternToString()),
      // Get the next_action string, which is the pattern name without `pattern_` at the beginning.
      patternRecognizer.actionPatternToString()).then(() =>
      patternRecognizer.dropActionsTable()).then(
      () => patternRecognizer.removePointFromPointsTable()).then(() => {
        delete this.patternRecognizers[pattern];
        resolve(true);
      });
    });
  }

  /**
    Takes a pattern, and returns the nearest n-dimensional neighbor

    @param pattern {Object} An n-dimensional point described as three
    Object properties, each containing an array of numbers.

    ex: {inputState: [-1], actionState: [a], driveState: [x]}

    @returns {string} A string of the form 'pattern_x_y_...n'
  */
  getNearestPatternRecognizer (nDimensionalPoint) {
    const schemaValidator = nDimensionalPointSchema.validate(nDimensionalPoint);
    if (schemaValidator.error !== null) {
      throw schemaValidator;
    }

    // Attempt to access cached nearest neighbor first, and if not available
    // to the db query and then cache.
    const nearestNeighborQueryString = this.nearestNeighborQueryString(nDimensionalPoint);
    const nearestNeighborString = PatternRecognizer.patternToString(nDimensionalPoint);

    return config.caching.enabled ?
      nodeFn
        .call(memcached.get.bind(memcached), nearestNeighborString)
        .then(cachedNearestNeighbor => {
          return cachedNearestNeighbor ?
            cachedNearestNeighbor
            : this.nearestNeighborQuery(cachedNearestNeighbor, nearestNeighborQueryString, nearestNeighborString);
        })
      : this.nearestNeighborQuery(null, nearestNeighborQueryString, nearestNeighborString);
  }

  // TODO: add integration tests
  nearestNeighborQuery (cachedNearestNeighbor, nearestNeighborQueryString, nearestNeighborString) {
    if (cachedNearestNeighbor) {
      return cachedNearestNeighbor;
    }

    // query global points table for nearest neighbor
    const globalPointsTableName = config.get('db').globalPointsTableName;
    return knex(globalPointsTableName)
      .select('point', 'id')
      .orderByRaw(nearestNeighborQueryString)
      .limit(1)
      .then((result) => {
        return config.caching.enabled ?
          nodeFn
            .call(memcached.set.bind(memcached), nearestNeighborString, result[0].point, 0)
            .then(() => result[0].point)
          : { point: result[0].point, id: result[0].id };
      }, (error) => {
        console.log('nearestNeighborQuery: failure to access global points table')
        return false
      });
  }

  /**
  @param pattern {Object} An n-dimensional point described as three
    Object properties, each containing an array of numbers.

    Note that this query assumes that the number of 'point_index' columns
    in the global points table equals the dimensionality of the n-dimensional point.

    ex: {inputState: [-1], actionState: [a], driveState: [x]}
  */
  nearestNeighborQueryString (nDimensionalPoint) {
    const schemaValidator = nDimensionalPointSchema.validate(nDimensionalPoint);
    if (schemaValidator.error !== null) {
      throw schemaValidator;
    }

    let outputString = '';

    // create one long array of inputState, actionState, and driveState
    const combinedPointArray = nDimensionalPoint.inputState.concat(nDimensionalPoint.actionState.concat(nDimensionalPoint.driveState));
    // create SQL query that gets sum of squares distance between nDimensionalPoint
    // and every point in global points table

    outputString = outputString.concat(combinedPointArray.map(this.sumOfSquaresQueryString).join(''));
    return outputString;
  }

  /**
  @returns an array that can be join('') to get a portion of square distance mysql query string

  output example: `POWER(10 - point_index_${0}, 2) + POWER (5 - point_index_${1}, 2) + POWER (3 - point_index_${2}, 2)`
  */
  sumOfSquaresQueryString (val, index, array) {
    if (array.length === 0) { return ''; }
    let output = '';

    index !== 0 ? output = output + ' + ' : null;
    output = output + `POWER(${val} - point_index_${index}, 2)`;

    return output;
  }


  /**
    Splits an existing patternRecognizer. The point split off begins with the 
    same weights as the originator.

    @param originalPatternRecognizerString {string} name of an existing PatternRecognizer instance.
    @param newPoint {object} a new point matching schemas.nDimensionalPointSchema.

    @returns A promise that resolves to the newly-created PatternRecognizer object.
  */
  splitPatternRecognizer (originalPatternRecognizerString, newPoint) {
    const schemaValidator = nDimensionalPointSchema.validate(newPoint);
    if (schemaValidator.error !== null) {
      return Promise.reject(new Error('splitPatternRecognizer(): Incorrect format for newPoint!'));
    }

    const newPatternRecognizer = new PatternRecognizer(newPoint);

    if (typeof this.patternRecognizers[newPatternRecognizer.patternToString()] !== 'undefined') {
      return Promise.reject(new Error('splitPatternRecognizer(): Split failted. Split point is already a PatternRecognizer.'));
    }

    return Promise.all([
      this.patternRecognizers[originalPatternRecognizerString].resetUpdateCount(),
      newPatternRecognizer.copyActionsTable(originalPatternRecognizerString),
      newPatternRecognizer.addPointToPointsTable()
    ]).then(() => {
      this.patternRecognizers[newPatternRecognizer.patternToString()] = newPatternRecognizer;

      // Verify that the action pattern doesn't already exist in the splitting PatternRecognizer's table.
      // The assumption is that if it doesn't exist here, it needs to be added to every PatternRecognizer table.
      return this.doesActionsPatternExist(
        newPatternRecognizer.actionPatternToString(),
        originalPatternRecognizerString
      );
    }).then((isActionPatternAlreadyInTables) => {
      if (isActionPatternAlreadyInTables) { return true; }

      // this is slooooooow. TODO: improve performance. try skipping the map() by patternToString() values.
      return newPatternRecognizer.addPatternToExistingActionsTables(
        _.map(this.patternRecognizers, (patternRecognizer) => patternRecognizer.patternToString()),
        this.patternRecognizers[originalPatternRecognizerString].actionPatternToString()
      );
      return true;
    }).then(() => {
      // Need to flush memcached every time a pattern recognizer is added
      // b/c old nearest neighbors may no longer be applicable.
      return config.caching.enabled ?
        nodeFn
          .call(memcached.flush.bind(memcached))
          .then(() => newPatternRecognizer)
        : newPatternRecognizer;
    });
  }

  doesActionsPatternExist(patternRecognizerActionString, patternTableName) {
    return knex.select('next_action')
      .from(patternTableName)
      .where('next_action', patternRecognizerActionString)
      .then((results) => { return results.length ? true : false; });
  }

  // TODO #6: possible dynamic dimensionality reduction algorithm:
  // -normalize all dimensions
  // -split dimensions into 2 subarrays (i guess just by middle of array)
  // -average each subbarray. that becomes the 2d point.

  // TODO #4: normalize function
  // 1) shift so leftmost range value is 0
  // 2) divide normalization max value (say, 100), by the number to be normalize after shifting

  // TODO #5: de-normalize function
  // 1) multiply normalize number by max de-normalized value (say, 5)
  // 2) shift by the opposite value of normalization shift

  getNumberOfPatterns() {
    return Object.keys(this.patternRecognizers).length;
  }
}

module.exports = PatternRecognitionGroup;
