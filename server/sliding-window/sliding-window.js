const TimeStep = require('./time-step');
const _ = require('lodash');

/**
  A sliding window representing the last n timesteps.
*/

class SlidingWindow {
  constructor(numberOfTimeSteps) {
    this.numberOfTimeSteps = numberOfTimeSteps || 5;
    this.timeSteps = [];
  }

  isFull() {
    console.log('TIMESTEPS LENGTH: ')
    console.log(this.timeSteps.length)
    return this.timeSteps.length >= this.numberOfTimeSteps;
  }

  flush() {
    this.timeSteps = [];
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

  // @return Return the drive score. TODO: refactor to take
  // different time periods.
  getDriveScore() {
    // last score:
    return this.timeSteps[this.timeSteps.length - 1].score;
  }

  getHead() {
    return this.timeSteps[0];
  }

  getTailHead() {
    return this.timeSteps[1];
  }
}

module.exports = SlidingWindow;
