// TODO: write tests for multiple dimensions/length combos

exports.cartesianProduct = (sets, outputList = [], currentIndices, depth = 0) => {
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
        exports.cartesianProduct(sets, [], currentIndices, depth + 1)
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
