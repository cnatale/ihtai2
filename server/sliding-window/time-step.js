/**
  Represents a single timestep in a sliding window. Each Timestep holds:
  -the key of the action taken at this moment
  -the key of the entire state at this moment
  -the average drive score from the NEXT moment
*/

class TimeStep {
  /**
    @param actionKey {string} the action subtring of a timestep
    @param stateKey {string} the entire Ihtai state for a timestep
    @param score {number} the average drive score
  */
  constructor (actionKey, stateKey, score) {
    this.actionKey = actionKey;
    this.stateKey = stateKey;
    this.score = score;
  }
}

module.exports = TimeStep;
