
const PatternRecognizer = require('./pattern-recognizer');


/**
  Properties:

  patternRecognizers {Object} Each key is a string representing a stored pattern.

*/

class PatternRecognitionGroup {

  /**
      @param nDimensionalPoints {array} point used for creating child PatternRecognizers.
        Length = inputState.length + actionState.length + driveState.length
        Ex: [{inputState: -1, actionState: 'a', driveState: 'x'},
             {inputState: 0, actionState: 'b', driveState: 'y'},
             {inputState: 1, actionState: 'c', driveState: 'z'}]

      @param possibleActionValues {array} an array where each index is an array of all possible
        values for the respective component signal.
        Ex: [[-1, 0, 1], ['a', 'b', 'c'], ['x', 'y', 'z']]

  */
  constructor() {
    this.patternRecognizers = {};
  }

  initialize (nDimensionalPoints, possibleActionValues) {
    // dimensionality can be determined by using .length of one of the nDimensionalPoints
    if (!nDimensionalPoints || !Array.isArray(nDimensionalPoints)) {
      throw 'Error: PatternRecognitionGroup contructor must be passed an array of n dimensional points!';
    }

    if (!possibleActionValues || !Array.isArray(possibleActionValues)) {
      throw 'Error: PatternRecognitionGroup contructor must be passed an array of possible action values!';
    }

    // TODO: create patternRecognizers from lists
    return Promise.all(nDimensionalPoints.map((nDimensionalPoint) => {
      const nDimensionalPointString = PatternRecognizer.patternToString(nDimensionalPoint);
      const patternRecognizer = new PatternRecognizer(nDimensionalPoint);
      this.patternRecognizers[nDimensionalPointString] = patternRecognizer;

      return new Promise((resolve) => {
        patternRecognizer.initializeTables(possibleActionValues)
          .then((result) => {
            console.log('******* I HAVE BEEN CALLED **********');

            // done with initialization at this point
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
