/**
  A sliding window representing the last n timesteps.
*/

const TimeStep = require('./time-step');


class SlidingWindow {
  constructor(numberOfTimeSteps) {
    this.numberOfTimeSteps = numberOfTimeSteps;
    this.timeSteps = [];
  }

  /**
    @param actionTakenKey {string} string representing the action taken
    @param driveScore {number} the drive score average of all drives the moment after action
           in actionTakenKey occurred.
  */
  addTimeStep(actionTakenKey, driveScore) {
    this.timeSteps.push(new TimeStep(actionTakenKey, driveScore));
    if ( this.timeSteps.length > this.numberOfTimeSteps ) {
      this.timeSteps.shift();
    }
    return this.timeSteps;
  }

  getAverageDriveScore() {
    return this.timeSteps.reduce((acc, timeStep, index, timeSteps) => {
      return acc + (timeStep.driveScore / timeSteps.length);
    }, 0);
  }

}

module.exports = SlidingWindow;
