// test creation, functionality of individual pattern recognizers
const chai = require('chai');
const expect = chai.expect;
const PatternRecognizer = require('../../../../server/pattern-recognition/pattern-recognizer');

describe('Pattern Recognizer Unit Tests', () => {
  describe('actionTimePeriodComboToString', () => {
    it('should return an action/time period combo string for use as a uid in db table', () => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1, 2],
        actionState: [3, 4],
        driveState: [5, 6]
      });

      expect(patternRecognizer.actionTimePeriodComboToString('1_2_3', 0))
        .to.equal('1_2_3+0');

      expect(patternRecognizer.actionTimePeriodComboToString('3_2_1', 5))
        .to.equal('3_2_1+5');
    });

    it('should throw an error when first param is not a string', () => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1, 2],
        actionState: [3, 4],
        driveState: [5, 6]
      });

      expect(patternRecognizer.actionTimePeriodComboToString
        .bind(patternRecognizer, 5)).to.throw();

      expect(patternRecognizer.actionTimePeriodComboToString
        .bind(patternRecognizer)).to.throw();
    });

    it('should throw an error when second param is not a Number', () => {
      const patternRecognizer = new PatternRecognizer({
        inputState: [1, 2],
        actionState: [3, 4],
        driveState: [5, 6]
      });

      expect(patternRecognizer.actionTimePeriodComboToString
        .bind(patternRecognizer, '1_2_3')).to.throw();

      expect(patternRecognizer.actionTimePeriodComboToString
        .bind(patternRecognizer, '1_2_3', '5')).to.throw();
    });
  });
});
