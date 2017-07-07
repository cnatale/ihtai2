

describe('patternRecognitionGroup', () => {
  describe('deletePatternRecognizer()', () => {
    it('should be able to delete a patternRecognizer when passed its pattern', () => {
      // TODO: still need logic added to pattern-recognizer
      // Actually this should probably be handled by a pattern-recognition-group
    });
  });

  describe('populateFromDb()', () => {
    it('should build a pattern-recognition-group from existing db when passed a pattern', () => {
      // TODO: populate pattern db tables with pattern recognizer data
      // TODO: write populateFromDb() method that gets all tables and creates
      //       1 patternRecognizer per table inside pattern-recognition-group 
    });
  });

  describe('constructor', () => {
    it('should build a pattern-recognition-group based on a list of patterns and their possible drive states', () => {

    });    
  });

  describe('getNearestPatternRecognizer()', () => {
    it('should return nearest neighbor pattern when passed a pattern of matching dimensionality', () => {

    });
  });
});
