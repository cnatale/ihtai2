/**
  Represents a single timestep in a sliding window. Each Timestep holds:
  -the key of the action taken at this moment
  -the average drive score from the NEXT moment
*/

class TimeStep {
  /**
    @param actionTakenKey {string}
    @param driveScore {number} the average drive score
  */
  constructor (stateKey, score) {
    this.stateKey = stateKey;
    this.score = score;
  }
}

module.exports = TimeStep;
