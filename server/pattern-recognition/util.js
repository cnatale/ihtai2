/**
  @param sets: an n element array, with each element an array of possible
    values for the i'th component.
    ex: [['a', 'b', 'c'], [1, 2, 3], ['x', 'y', 'z']]

  @param currentIndices: the current index value for all n components

  @param depth: how 'deep' the algorithm has descended, in terms of dimension 0
    of the sets array.
    ex: a value of 2 would relate to the the array ['x', 'y', 'z'] in the example
      above.

  @returns an array of all possible signal combinations
  example usage:
    cartesianProduct([['a', 'b'], [1, 2]])

    // outputs: ['a_1', 'a_2', 'b_1', 'b_2']
*/

exports.cartesianProduct = (sets, currentIndices, depth = 0) => {
  let outputList = [];

  // if no current indices, initialize all to 0.
  if (!currentIndices) {
    currentIndices = sets.map(() => {
      return 0;
    });
  }

  // loop through all elements in set.
  for (let i = 0; i < sets[depth].length; i++) {
    currentIndices[depth] = i;
    // recursively descend to length-1 elements in sets every increment
    if (depth < sets.length - 1) {
      outputList = outputList.concat(
        exports.cartesianProduct(sets, currentIndices, depth + 1)
      );
    } else {
      // add a combination when at deepest depth
      outputList.push(
        currentIndices.map(
          (val, index) => {
            return sets[index][val];
          }).join('_')
      );
    }
  }

  return outputList;
};
