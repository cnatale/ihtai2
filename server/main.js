const SlidingWindow = require('./sliding-window/sliding-window');
const PatternRecognitionGroup = require('./pattern-recognition/pattern-recognition-group');
const dbUtil = require('./db/util');
const bunyan = require('bunyan');
const log = bunyan.createLogger({ name: 'Ihtai' });

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// instantiate with number of timesteps stored
const slidingWindow = new SlidingWindow(5);
const patternRecognitionGroup = new PatternRecognitionGroup();

// test initialization. for final version, take json params
app.get('/initialize', function (req, res) {
  patternRecognitionGroup.initialize(
    [
      { inputState:[5], actionState: [5], driveState: [5] },
      { inputState: [10], actionState: [10], driveState: [10] },
      { inputState:[0], actionState: [15], driveState: [0] },
      { inputState: [20], actionState: [20], driveState: [20] }          
    ],
    [
      [0, 5, 10, 15, 20], 
      [0, 5, 10, 15, 20],
      [0, 5, 10, 15, 20]
    ]
  ).then(() => {
    log.info('PATTERN RECOGNITION GROUP INITIALIZED');
    res.send('PATTERN RECOGNITION GROUP INITIALIZED');
  }, () => {
    log.error('FAILURE INITIALIZING PATTERN RECOGNITION GROUP');
    res.send('FAILURE INITIALIZING PATTERN RECOGNITION GROUP');
  });
});

app.post('/initialize', function (req, res) {
  // TODO: verify req.body is valid json
  log.info('initialization request received');
  log.info(req.body);

  patternRecognitionGroup.initialize(
    req.body.startingData, 
    req.body.possibleDataValues
    ).then(() => {
      log.info('PATTERN RECOGNITION GROUP INITIALIZED');
      res.send('PATTERN RECOGNITION GROUP INITIALIZED');    
    }, () => {
      log.error('FAILURE INITIALIZING PATTERN RECOGNITION GROUP');
      res.send('FAILURE INITIALIZING PATTERN RECOGNITION GROUP');
    });
});

/*
  returns the table name of the nearest neighbor pattern
*/
app.post('/nearestPatternRecognizer', function (req, res) {
  log.info('request for nearest patternRecognizer received');
  log.info(req.body);

  patternRecognitionGroup.getNearestPatternRecognizer(
    {
      inputState: req.body.inputState,
      actionState: req.body.actionState,
      driveState: req.body.driveState
    }
  ).then((nearestPatternRecognizer) => {
    res.send(nearestPatternRecognizer);
  });
});

// expose patternRecognizer.getBestNextAction() when given a patternRecognizer
app.post('bestNextAction', function (req, res) {
  log.info('request for best next action received');
  log.info(req.body);

  // first, get the patternRecognizer from patternRecognitionGroup
  const patternRecognizer = 
    patternRecognitionGroup.getPatternRecognizer(req.body.patternString);

  patternRecognizer.getBestNextAction().then((result) => {
    // result format:
    // { score: {number}, next_action: {string (ex: '1_3_5')}}
    res.send(result);
  });
});

// @params none
// given current slidingWindow head, update score for next move that
// equals the slidingWindow tailHead's key
// @return promise that resolves to true or false
app.put('updateScore', function (req, res) {
  log.info('request to update score for sliding window head received');
  log.info('req.body');

  const patternRecognizer = 
    patternRecognitionGroup.getPatternRecognizer(
      'pattern_' + slidingWindow.head.stateKey
    );

  const avgScoreOverTimeSeries = slidingWindow.getAverageDriveScore();

  // ex. nextMove string: '1_3_5_2'. Similar to patternRecognizer key format, but
  // no starting 'pattern_'
  patternRecognizer.updateNextMoveScore(
    slidingWindow.getTailHead().stateKey,
    avgScoreOverTimeSeries
  ).then((successOrFailure) => {
    res.send(successOrFailure);
  });
});

// expose ability to update sliding window, and return current sliding window
// state 
// @param actionTakenString {string}: string representation of action taken.
//   ex: '1_2_4_3'
// @param score {number} the average drive score for this slidingWindow action at this point in time 
app.put('addTimeStep', function (req, res) {
  log.info('request to addTimeStep received');
  log.info('req.body');

  res.send(
    slidingWindow.addTimeStep(req.body.stateKey, req.body.score)
  );
});

// expose method to find out if tables have already been created for Ihtai, and
//  returning true or false

// expose method to clear db
app.delete('/db', function (req, res) {
  dbUtil.emptyDb().then(() => {
    log.info('DB CLEARED');
    res.send('DB CLEARED');
  }, () => {
    log.error('FAILURE CLEARING DB');
    res.send('FAILURE CLEARING DB');
  });  
});

// serve static client files
app.use(express.static('client'));

app.listen(3800);
