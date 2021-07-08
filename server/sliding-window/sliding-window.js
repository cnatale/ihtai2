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

    Most recent timesteps are added to the end of the timesteps array. If there are too many timeSteps,
    one is removed from the beginning of the timeSteps array.

    @param actionKey {string}
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

    @param distanceFromCurrentMoment {number, Integer greater than 0} The distance from head with which to select
      score property. Inclusive.

    @param startingIndex {number, Integer 0 or positive} Which index to start the averaging from. Set to non-zero
      if you want there to be a delay to account for actions taking some time to manifest
      changes in drive scores.

    @returns {number} the computed drive score.
  */

  getAverageDriveScore(distanceFromCurrentMoment, startingIndex = 1) {
    if (distanceFromCurrentMoment > this.timeSteps.length) {
      throw new Error('param `distanceFromCurrentMoment` cannot be greater than the number of timeSteps in memory');
    }
    if (startingIndex >= distanceFromCurrentMoment) {
      throw new Error('param distanceFromCurrentMoment must be less than startingIndex');
    }

    const scoresToAverage = this.timeSteps
      .slice(startingIndex, distanceFromCurrentMoment)
      .map((timeStep, index, array) => {
        // if one of the streams has a timestep length of 2 or less, array.length can be 1 and cause an error if we don't exit early.
        if(array.length === 1) { return timeStep.score }
        // evenly weighted
        // return timeStep.score;

        // the old front-weighted algo:
        // the old algo would always give a dist of three a 1.5 weight
        // return timeStep.score * ((array.length - index) / (array.length) + .5)
        // increase importance of short-term values (numbers at the beginning of timeSteps queue)
        const l = array.length - 1;
        const score = timeStep.score * (((l - index) / l) + .5);
        // console.log('*****************')
        // console.log(`l: ${l}`)
        // console.log(`index: ${index}`)
        // console.log(`score: ${timeStep.score}`)
        // console.log(`weighted score: ${score}`)
        // console.log('*****************')
        return score;
        // ex algo 1:
        // 0: ((4 - 0) / 4) + .5 = 1.5
        // 1: ((4 - 1) / 4) + .5 = 1.25
        // 2: ((4 - 2) / 4) + .5 = 1
        // 3: ((4 - 3) / 4) + .5 = .75
        // total: 4.5
        // effect = bigger relative scores for shorter time periods?

        // 0: ((0 - 0) / 0) + .5 = .5 // this would give the smallest time period a .5 multiplier


        // ex algo 2:
        // 0: ((3 - 0) / 3) + .5 = 1.5
        // 1: ((3 - 1) / 3) + .5 = ~1.2
        // 2: ((3 - 2) / 3) + .5 = ~.8
        // 3: ((3 - 3) / 3) + .5 = .5
        // total: 4
        // effect = identical weighting for shorter and longer time periods?

        // increase importance of long-term values (numbers at the end of timeSteps queue)
        // return timeStep.score * (index / (array.length) + .5)
      });

    return (math.sum(scoresToAverage) / scoresToAverage.length) /*- (scoresToAverage.length * .1) */;
  }

  /**
  
    @returns {Array of Numbers} representing average score for every timeStep stream
      specified in scoreTimesteps
  */
  getAllAverageDriveScores() {
    // Remove all timeStep distances that are greater than what is stored in this.timeSteps.
    const filteredScoreTimeSteps = this.scoreTimesteps.filter((scoreTimeStepDistance) => {
      const index = scoreTimeStepDistance;
      return index <= this.timeSteps.length;
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
