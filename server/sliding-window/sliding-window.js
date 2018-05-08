const TimeStep = require('./time-step');
const _ = require('lodash');
const assert = require('assert');
const Joi = require('joi');
const math = require('mathjs');

/**
  A sliding window representing the last n timesteps.
  @param numberOfTimeSteps {Number} - the number of timesteps stored in sliding window
  @param scoreTimesteps {Array of Numbers} - the timesteps which should be recorded for memory retrieval
*/

class SlidingWindow {
  constructor(numberOfTimeSteps, scoreTimesteps) {
    this.assertConstructorParams(numberOfTimeSteps, scoreTimesteps);

    this.numberOfTimeSteps = numberOfTimeSteps || 5;
    this.scoreTimesteps = scoreTimesteps;
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

  isFull() {
    return this.timeSteps.length >= this.numberOfTimeSteps;
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

    @returns {number} the drive score.
  */

  // TODO: I think this is wrong. The old version performed the following operation:
  // return this.timeSteps[this.timeSteps.length - 1].score;
  getDriveScore(distanceFromCurrentMoment) {
    // ex: this would return the most recently-added timeStep.
    // return this.timeSteps[this.timeSteps.length - 1].score;

    // this is useless because it's looking backwards in time from the most recent action.
    // needs to look forward from earliest index.

    // commenting out original logic to try a summation-based approach
    // ///////////////////////////////////////////////////
    // const index = distanceFromCurrentMoment;
    // if (index >= this.timeSteps.length) { throw new Error('Distance is greater than number of timesteps!'); }

    // return this.timeSteps[index].score;
    // //////////////////////////////////////////////////
    
    const startingIndex = 20;

    const scoresToAverage = this.timeSteps
      .slice(startingIndex, distanceFromCurrentMoment)
      .map((timeStep, index, array) => {
        // weight early scores higher than later ones
        // evenly weighted
        return timeStep.score;

        // weight to short-term
        // return timeStep.score * ((array.length - index) / (array.length) + 1)

        // weight to long-term
        // return timeStep.score * (index / (array.length) + 1)
      });

    return math.sum(scoresToAverage) / scoresToAverage.length;
    // return this.timeSteps[20].score;
  }

  /**
  
    @returns {Array of Numbers} representing score for every timeStep distance
      specified in scoreTimesteps
  */
  getAllDriveScores() {
    // Remove all timeStep distances that are greater than what is stored in this.timeSteps.
    const filteredScoreTimeSteps = this.scoreTimesteps.filter((scoreTimeStepDistance) => {
      const index = scoreTimeStepDistance;
      return index < this.timeSteps.length;
    });

    return filteredScoreTimeSteps.map((scoreTimeStepDistance) => {
      return this.getDriveScore(scoreTimeStepDistance);
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
