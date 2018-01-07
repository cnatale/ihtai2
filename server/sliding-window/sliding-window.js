const TimeStep = require('./time-step');

/**
  A sliding window representing the last n timesteps.
*/

class SlidingWindow {
  constructor(numberOfTimeSteps) {
    this.numberOfTimeSteps = numberOfTimeSteps || 5;
    this.timeSteps = [];
  }

  isFull() {
    return this.timeSteps.length >= this.numberOfTimeSteps;
  }

  /**
    Adds an action taken and entire instance state to sliding window, along with its drive score.
    Note that this assumes client is keeping track of the string representing
    current Ihtai state that is the starting point for this action
    @param stateKey {string} string representing the agent state at this moment
    @param driveScore {number} the drive score average of all drives the moment after action
           in actionTakenKey occurred.
  */
  addTimeStep(actionKey, stateKey, driveScore) {
    this.timeSteps.push(new TimeStep(actionKey, stateKey, driveScore));

    if ( this.timeSteps.length > this.numberOfTimeSteps ) {
      this.timeSteps.shift();
    }

    return this.timeSteps;
  }

  // @return the average drive score for scores influenced by 
  //   the tail-head's action. Starts with tail-head because
  //   we need to be able to figure out, starting with a state,
  //   how the next action influences average drive scores.
  getAverageDriveScore() {
    return this.timeSteps.reduce((acc, timeStep, index, timeSteps) => {
      // skip the first index because we only want to account for
      // actions influenced by the action taken by tailHead state
      return index === 0 ?
        acc :
        acc + (timeStep.score / (timeSteps.length - 1));
    }, 0);
  }

  getHead() {
    return this.timeSteps[0];
  }

  getTailHead() {
    return this.timeSteps[1];
  }
}

module.exports = SlidingWindow;
