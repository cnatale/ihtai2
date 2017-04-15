// Individual pattern recognizer
/* A point in n-dimensional space representing:
  -input state
  -action state
  -drive state
  ...each of which is its own n-dimensional number

*/

class PatternRecognizer {
  constructor(nDimensionalPoint) {

  }


  /**
    Get the best action to carry out based on current state

    @return {string} the string representing next action to take
  */
  getBestNextAction() {
    // TODO: query db for lowest drive score 
  }

  /**
    Get list of all next actions and their scores, for diagnostic purposes.

    @return {object} List of all next actions and their scores. Order not guaranteed.
  */
  getNextActionScores() {

  }


  /**
    Reweights the 
    @param slidingWindow (Object) Slding window of stimesteps. Has the following properties:
      - startingAction: the action that  
  */
  reweight(slidingWindow) {


  }
}

exports.default = PatternRecognizer;
