const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

// TODO: listen for requests on startup (use express http router for now)
// TODO: initialize one SlidingWindow for Ihtai instance on startup
// TODO: initialize a PatternRecognitionGroup when requested
// TODO: increment SlidingWindow based on client time series data when requested
// TODO: use combination of PatternRecognitionGroup .getNearestPatternRecognizer() 
//    and .updatePatternScore() to update table scores for all patternRecognitionGroups
// TODO: expose ability to .getBestNextAction() for a given pattern (accessed through
//    patternRecognitionGroup.getNearestPatternRecognizer())


describe('main', () => {

  describe('initialization', () => {
    it('should instantiate a patternRecognitionGroup and slidingWindow', () => {

    });
  });

});

