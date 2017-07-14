
const PatternRecognizer = require('./pattern-recognizer');
const _ = require('lodash');

/**
  Properties:

  patternRecognizers {Object} Each key is a string representing a stored pattern.

*/

class PatternRecognitionGroup {

  /**
      @param nDimensionalPoints {array} point used for creating child PatternRecognizers.
        Length = inputState.length + actionState.length + driveState.length
        Ex: [{inputState: [-1], actionState: ['a'], driveState: ['x']},
             {inputState: [0], actionState: ['b'], driveState: ['y']},
             {inputState: [1], actionState: ['c'], driveState: ['z']}]

      @param possibleActionValues {array} an array where each index is an array of all possible
        values for the respective component signal.
        Ex: [[-1, 0, 1], ['a', 'b', 'c'], ['x', 'y', 'z']]

  */
  constructor() {
    this.patternRecognizers = {};
  }


  /**
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
              throw (`Error: PatternRecognitionGroup.initialize: initializeTables() failed
                on one or more PatternRecognizer`);
            }

            resolve(true);
          });
      });
    }));
  }

  addPatternRecognizer () {

  }

  /*
    @param pattern {String} A string representing the pattern to delete
  */
  deletePatternRecognizer (pattern) {
    const patternRecognizer = this.patternRecognizers[pattern];
    patternRecognizer.dropActionsTable()
      .then((result) => {
        if (!result) { throw 'Error: pattern recognizer was not dropped from actions table'; }


      });
  }

  // TODO: should implement a getNearestNeighbor(nDimPoint) method that searches all child
  // pattern recognizers for clostest point to nDimPoint param

}

module.exports = PatternRecognitionGroup;
