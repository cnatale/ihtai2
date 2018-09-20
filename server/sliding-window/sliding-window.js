const TimeStep = require('./time-step');
const _ = require('lodash');
const assert = require('assert');
const Joi = require('joi');
const math = require('mathjs');

/**
  A sliding window representing the last n timesteps.
  @param numberOfTimeSteps {Number} - the max number of timesteps stored in sliding window
  @param scoreTimesteps {Array of Numbers} - the timesteps which should be recorded for memory retrieval.
    Allows for storing multiple averages. Each value in the array represents the number of timesteps
    into the future a particular recording will track.
*/

class SlidingWindow {
  constructor(numberOfTimeSteps, scoreTimesteps) {
    this.assertConstructorParams(numberOfTimeSteps, scoreTimesteps);

    this.numberOfTimeSteps = numberOfTimeSteps || 5;
    this.scoreTimesteps = scoreTimesteps;
    // A queue of timeSteps. Lower indices represent most recent scores
    this.timeSteps = [];
  }

  // Breaking this into its own function so I can write tests targeting it.
  assertConstructorParams(numberOfTimeSteps, scoreTimesteps) {
    if (isNaN(numberOfTimeSteps)) { throw new Error('param numberOfTimeSteps must be a number!'); }
    Joi.validate(
      scoreTimesteps,
      Joi.array().items(Joi.number()).required(),
      function (err) {
        if (err) { throw err; }
      }
    );

    return true;
  }

  isMinimallyFull() {
    return this.scoreTimesteps.some(scoreTimestep =>
      this.timeSteps.length >= scoreTimestep
    );
  }

  flush() {
    this.timeSteps = [];
  }

  /**
    Adds an action taken and entire instance state to sliding window, along with its drive score.
    Note that this assumes client is keeping track of the string representing
    current Ihtai state that is the starting point for this action.

    Most recent timesteps are added to the end of the timesteps array.

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

  /**
    Gets the drive score a particular number of timeSteps in the past.

    @param distanceFromCurrentMoment {number} The distance from head with which to select
      score property. A value of 0 would return the last timestep added to array,
      1 the second from last, and so on.

    @returns {number} the computed drive score.
  */

  getAverageDriveScore(distanceFromCurrentMoment) {    
    const startingIndex = 20;

    const scoresToAverage = this.timeSteps
      .slice(startingIndex, distanceFromCurrentMoment)
      .map((timeStep, index, array) => {
        // evenly weighted
        //return timeStep.score;

        // weight to short-term (numbers at the beginning of timeSteps queue)
        return timeStep.score * ((array.length - index) / (array.length) + 1)

        // weight to long-term (numbers at the end of timeSteps queue)
        // return timeStep.score * (index / (array.length) + 1)
      });

    
    return math.sum(scoresToAverage) / scoresToAverage.length;
  }

  /**
  
    @returns {Array of Numbers} representing average score for every timeStep stream
      specified in scoreTimesteps
  */
  getAllAverageDriveScores() {
    // Remove all timeStep distances that are greater than what is stored in this.timeSteps.
    const filteredScoreTimeSteps = this.scoreTimesteps.filter((scoreTimeStepDistance) => {
      const index = scoreTimeStepDistance;
      return index < this.timeSteps.length;
    });

    return filteredScoreTimeSteps.map((scoreTimeStepDistance) => {
      return this.getAverageDriveScore(scoreTimeStepDistance);
    });
  }

  getHead() {
    return this.timeSteps[0];
  }

  getTailHead() {
    return this.timeSteps[1];
  }
}

module.exports = SlidingWindow;
