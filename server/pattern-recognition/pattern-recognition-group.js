
const PatternRecognizer = require('./pattern-recognizer');
const _ = require('lodash');
const knex = require('../db/knex');
const config = require('config');

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

    @returns Array of Promises, one for each point to add.
    All resolve to true if the operation was successful.
  */
  initialize (nDimensionalPoints, possibleActionValues) {
    // dimensionality can be determined by using .length of one of the nDimensionalPoints
    if (!nDimensionalPoints || !Array.isArray(nDimensionalPoints)) {
      throw 'Error: PatternRecognitionGroup contructor must be passed an initialization array of n dimensional points!';
    }

    if (!possibleActionValues || !Array.isArray(possibleActionValues)) {
      throw 'Error: PatternRecognitionGroup contructor must be passed an array of possible action values!';
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
    if (!this.possibleActionValues) {
      return Promise.reject(new Error('PatternRecognitionGroup.addPatternRecognizer: possibleActionValues not initialized.'));
    }


    // TODO: think I want to pass in the point after finding nearest neighbor, not the
    // original point.
    const nDimensionalPointString = PatternRecognizer.patternToString(nDimensionalPoint);
    const patternRecognizer = new PatternRecognizer(nDimensionalPoint);
    this.patternRecognizers[nDimensionalPointString] = patternRecognizer;

    return new Promise((resolve) => {
      patternRecognizer.initializeTables(this.possibleActionValues)
        .then((results) => {

          // make sure every result returns expected array of mysql table row id's
          if (!_.every(results.map((result) => {
            return (Array.isArray(result) && _.every(result, (item) => {
              // make sure each array element is a row index number
              return !isNaN(item);
            }) && results.length >= 1);
          }))) {
            throw (`Error: PatternRecognitionGroup.addPatternRecogizer(): initializeTables() failed
              on one or more PatternRecognizer`);
          }

          resolve(true);
        });
    });
  }

  /**
    @param pattern {String} A string representing the pattern to delete
  */
  deletePatternRecognizer (pattern) {
    // TODO: add getNearestNeighbor call to find nearest neighbor to pattern

    // remove row containing point from global_points_table
    // remove all data from associated pattern_... table
    const patternRecognizer = this.patternRecognizers[pattern];

    if (typeof patternRecognizer === 'undefined') {
      throw ('Error: PatternRecognizer.deletePatternRecognizer: no matching pattern.');
    }

    patternRecognizer.dropActionsTable().then(() => {
      patternRecognizer.removePointFromPointsTable().then(() => {
        delete this.patternRecognizers[pattern];
      });
    }, () => {
      throw ('Error: PatternRecognizer.deletePatternRecognizer: there was a problem dropping the table.');
    });
  }

  /**
    Takes a pattern, and returns the nearest n-dimensional neighbor

    @param pattern {Object} An n-dimensional point described as three
    Object properties, each containing an array of numbers.

    ex: {inputState: [-1], actionState: [a], driveState: [x]}
  */
  getNearestPatternRecognizer (nDimensionalPoint) {
    // query global points table for nearest neighbor
    const globalPointsTableName = config.get('db').globalPointsTableName;
    return knex(globalPointsTableName)
      .select('point')
      .orderByRaw(this.nearestNeighborQueryString(nDimensionalPoint))
      .limit(1);
  }


  /**
  @param pattern {Object} An n-dimensional point described as three
    Object properties, each containing an array of numbers.

    ex: {inputState: [-1], actionState: [a], driveState: [x]}
  */
  nearestNeighborQueryString (nDimensionalPoint) {
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

}

module.exports = PatternRecognitionGroup;
