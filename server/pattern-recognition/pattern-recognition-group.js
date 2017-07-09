
class PatternRecognitionGroup {
  // TODO: should implement a getNearestNeighbor(nDimPoint) method that searches all child
  // pattern recognizers for clostest point to nDimPoint param

  /**
      @param nDimensionalPoints {array} point used for creating child PatternRecognizers.
        Length = dimensionality of points.
        Ex: [[-1, 'a', 'x'], [0, 'b', 'y'], [1, 'c', 'z']]

      @param possibleActionValues {array} an array where each index is an array of all possible
        values for the respective component signal.
        Ex: [[-1, 0, 1], ['a', 'b', 'c'], ['x', 'y', 'z']]

  */
  constructor(nDimensionalPoints, possibleActionValues) {
    // dimensionality can be determined by using .length of one of the nDimensionalPoints

  }


}

module.exports = PatternRecognitionGroup;
