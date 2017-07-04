// test creation, functionality of individual pattern recognizers
const chai = require('chai');
const expect = chai.expect;
const util = require('../../../../server/pattern-recognition/util');

describe.only('pattern recognition utility methods', () => {
  describe('cartesianProduct', () => {
    it('should generate all possible combinations of a 2x2 signal', () => {
      const sets = [[-1, 1], [-1, 1]];
      const expectedOutput = ['-1_-1', '-1_1', '1_-1', '1_1'];
      const cartesianProduct = util.cartesianProduct(sets);
      expect(cartesianProduct).to.deep.equal(expectedOutput);
    });

    it('should generate all possible combinations of a 3x3 matrix', () => {
      const sets = [['a', 'b', 'c'], [1, 2, 3]];
      const expectedOutput = [
        'a_1', 'a_2', 'a_3',
        'b_1', 'b_2', 'b_3',
        'c_1', 'c_2', 'c_3'];
      const cartesianProduct = util.cartesianProduct(sets);
      expect(cartesianProduct).to.deep.equal(expectedOutput);
    });

    it('should generate all possible combos for a 2x3 matrix', () => {
      const sets = [['a', 'b'], [1, 2, 3]];
      const expectedOutput = [
        'a_1', 'a_2', 'a_3',
        'b_1', 'b_2', 'b_3'];
      const cartesianProduct = util.cartesianProduct(sets);
      expect(cartesianProduct).to.deep.equal(expectedOutput);
    });

    it('should generate all possible combos for a 3x2 matrix', () => {
      const sets = [['a', 'b', 'c'], [1, 2]];
      const expectedOutput = [
        'a_1', 'a_2',
        'b_1', 'b_2',
        'c_1', 'c_2'];
      const cartesianProduct = util.cartesianProduct(sets);
      expect(cartesianProduct).to.deep.equal(expectedOutput);
    });

    it('should generate all possible combos of a 3 dimensional signal', () => {
      const sets = [['a', 'b'], [1, 2, 3], ['x', 'y', 'z']];
      const expectedOutput = [
        'a_1_x', 'a_1_y', 'a_1_z',
        'a_2_x', 'a_2_y', 'a_2_z',
        'a_3_x', 'a_3_y', 'a_3_z',
        'b_1_x', 'b_1_y', 'b_1_z',
        'b_2_x', 'b_2_y', 'b_2_z',
        'b_3_x', 'b_3_y', 'b_3_z'];
      const cartesianProduct = util.cartesianProduct(sets);
      expect(cartesianProduct).to.deep.equal(expectedOutput);      
    });
  });
});
