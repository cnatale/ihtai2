
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
    @param nDimensionalPoints {array} point used for creating child PatternRecognizers.
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
      throw 'Error: PatternRecognitionGroup contructor must be passed an array of n dimensional points!';
    }

    if (!possibleActionValues || !Array.isArray(possibleActionValues)) {
      throw 'Error: PatternRecognitionGroup contructor must be passed an array of possible action values!';
    }

    this.possibleActionValues = possibleActionValues;

    if (nDimensionalPoints.length === 0) {
      return Promise.resolve([]);
    }

    return Promise.all(nDimensionalPoints.map((nDimensionalPoint) => {
      const nDimensionalPointString = PatternRecognizer.patternToString(nDimensionalPoint);
      const patternRecognizer = new PatternRecognizer(nDimensionalPoint);
      this.patternRecognizers[nDimensionalPointString] = patternRecognizer;


      return new Promise((resolve) => {
        patternRecognizer.initializeTables(possibleActionValues)
          .then((results) => {

            // make sure every result returns expected array of mysql table row id's
            if (!_.every(results.map((result) => {
              return (Array.isArray(result) && _.every(result, (item) => {
                // make sure each array element is a row index number
                return !isNaN(item);
              }) && results.length >= 1);
            }))) {
              throw (`Error: PatternRecognitionGroup.initialize(): initializeTables() failed
                on one or more PatternRecognizer`);
            }

            resolve(true);
          });
      });
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
    patternRecognizer.dropActionsTable().then(() => {
      patternRecognizer.removePointFromPointsTable().then(() => {
        delete this.patternRecognizers[pattern];
      });
    }, () => {
      throw ('Error: PatternRecognizer.deletePatternRecognizer: there was a problem dropping the table.');
    });
  }

  /**
  @param pattern {Object} An n-dimensional point described as three
    Object properties, each containing an array of numbers.

    ex: {inputState: [-1], actionState: [a], driveState: [x]}
  */
  // TODO: should implement a getNearestNeighbor(nDimPoint) method that searches all child
  // pattern recognizers for clostest point to nDimPoint param
  getNearestNeighbor (nDimensionalPoint) {
    // TODO: add a method to create orderByRaw string with gets the sum of sq dist over all dimensional columns
    this.sumOfSquaresQueryString(pattern);

    // TODO: query global points table for nearest neighbor
    // TODO: orderBy should be a raw query of something like SUM(POW(a.coor - b.coor, 2))
    const globalPointsTableName = config.get('db').globalPointsTableName;
    knex(globalPointsTableName)
      .select('point')
      .orderByRaw('SUM(POW(a.coor - b.coor, 2))')
      .limit(2);

  }


  /**
  @param pattern {Object} An n-dimensional point described as three
    Object properties, each containing an array of numbers.

    ex: {inputState: [-1], actionState: [a], driveState: [x]}
  */
  nearestNeighborQueryString (nDimensionalPoint) {
    // map inputState, actionState, and driveState into a single query string
    let outputString = 'SUM(';

    // TODO: need to create one big array out of input, action, and drive states
    const combinedPointArray = nDimensionalPoint.inputState.concat(nDimensionalPoint.actionState.concat(nDimensionalPoint.driveState));

    outputString = outputString.concat(combinedPointArray.map(this.sumOfSquaresQueryString).join(''));

    outputString.concat(')');

    return outputString;
  }

  /**
  @returns an array that can be join('') to get a portion of square distance mysql query string

  output example: `SQR(10 - point_index_${0}) + SQR (5 - point_index_${1}) + SQR (3 - point_index_${2})`
  */
  sumOfSquaresQueryString (val, index, array) {
    if (array.length === 0) { return ''; }
    let output = '';

    index !== 0 ? output = output + ' + ' : null;
    output = output + `SQR(${val} - point_index_${index})`;

    return output;
  }

}

module.exports = PatternRecognitionGroup;
