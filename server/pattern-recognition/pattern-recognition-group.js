
const PatternRecognizer = require('./pattern-recognizer');
const _ = require('lodash');
const knex = require('../db/knex');
const config = require('config');
const Joi = require('joi');
const { nDimensionalPointSchema, nDimensionalPointsSchema } = require('../schemas/schemas');

/**
  Properties:

  patternRecognizers {Object} Each key is a string representing a stored pattern.

*/

class PatternRecognitionGroup {

  constructor() {
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
      values for the respective component signal.
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
        nDimensionalPoints[0].inputState.concat(
          nDimensionalPoints[0].actionState,
          nDimensionalPoints[0].driveState).length
      ); // length must equal n-dimensional point dimensionality

    const actionValuesSchemaValidation = possibleActionValuesSchema.validate(possibleActionValues);
    if (actionValuesSchemaValidation.error !== null) {
      throw actionValuesSchemaValidation;
    }

    this.possibleActionValues = possibleActionValues;

    if (nDimensionalPoints.length === 0) {
      return Promise.resolve([]);
    }

    return Promise.all(nDimensionalPoints.map((nDimensionalPoint) => {
      return this.addPatternRecognizer(nDimensionalPoint);
    }));
  }

  /**
    @param nDimensionalPoint {Object} An n-dimensional point described as three
    Object properties, each containing an array of numbers.

    ex: {inputState: [-1], actionState: [a], driveState: [x]}

    @returns {Promise} A promise resolving to true or false, depending on if action was successful
  */

  addPatternRecognizer (nDimensionalPoint) {
    const schemaValidator = nDimensionalPointSchema.validate(nDimensionalPoint);
    if (schemaValidator.error !== null) {
      return Promise.reject(schemaValidator);
    }

    if (!this.possibleActionValues) {
      return Promise.reject(new Error('PatternRecognitionGroup.addPatternRecognizer: possibleActionValues not initialized.'));
    }

    const nDimensionalPointString = PatternRecognizer.patternToString(nDimensionalPoint);
    const patternRecognizer = new PatternRecognizer(nDimensionalPoint);
    this.patternRecognizers[nDimensionalPointString] = patternRecognizer;

    return new Promise((resolve, reject) => {
      patternRecognizer.initializeTables(this.possibleActionValues)
        .then((results) => {

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
    if (!this.patternRecognizers[nDimensionalPointString]) {
      throw (`Error: PatternRecognitionGroup.getPatternRecognizer(): 
        no patternRecognizer found matching the input string`);
    }

    return this.patternRecognizers[nDimensionalPointString];
  }

  /**
    Removes:
      -row containing point from global_points_table
      -all data from associated pattern_... table
    @param pattern {String} A string representing the pattern to delete
  */
  deletePatternRecognizer (pattern) {
    // remove row containing point from global_points_table
    // remove all data from associated pattern_... table
    const patternRecognizer = this.patternRecognizers[pattern];

    if (typeof patternRecognizer === 'undefined') {
      throw ('Error: PatternRecognizer.deletePatternRecognizer: no matching pattern.');
    }

    return new Promise((resolve, reject) => {
      patternRecognizer.dropActionsTable()
        .then(() => {
          patternRecognizer.removePointFromPointsTable()
            .then(() => {
              delete this.patternRecognizers[pattern];
              resolve(true);
            }, (message) => {
              reject(message);
            });
        }, (message) => {
          reject(message);
        });
    });
  }

  shouldSplitPatternRecognizer (pattern) {
    const patternRecognizer = this.patternRecognizers[pattern];

    patternRecognizer.getThresholdState().then((result) => {

    });
  }

  /**
    Takes a pattern, and returns the nearest n-dimensional neighbor

    @param pattern {Object} An n-dimensional point described as three
    Object properties, each containing an array of numbers.

    ex: {inputState: [-1], actionState: [a], driveState: [x]}
  */
  getNearestPatternRecognizer (nDimensionalPoint) {
    const schemaValidator = nDimensionalPointSchema.validate(nDimensionalPoint);
    if (schemaValidator.error !== null) {
      throw schemaValidator;
    }

    // query global points table for nearest neighbor
    const globalPointsTableName = config.get('db').globalPointsTableName;
    return knex(globalPointsTableName)
      .select('point')
      .orderByRaw(this.nearestNeighborQueryString(nDimensionalPoint))
      .limit(1)
      .then((result) => result[0].point);
  }

  /**
  @param pattern {Object} An n-dimensional point described as three
    Object properties, each containing an array of numbers.

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

}

module.exports = PatternRecognitionGroup;
