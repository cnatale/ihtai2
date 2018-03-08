const SlidingWindow = require('./sliding-window/sliding-window');
const PatternRecognitionGroup = require('./pattern-recognition/pattern-recognition-group');
const dbUtil = require('./db/util');
const bunyan = require('bunyan');
const config = require('config');
const log = bunyan.createLogger({ name: 'Ihtai' });
log.level(config.log.level);
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

module.exports = app;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// instantiate with number of timesteps stored
const slidingWindow = new SlidingWindow(config.slidingWindow.size, config.slidingWindow.scoreTimesteps);
const patternRecognitionGroup = new PatternRecognitionGroup();

// test initialization. in practice, use the post version
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
  ).then((result) => {
    log.info('PATTERN RECOGNITION GROUP INITIALIZED');
    res.send(result);
  }, (message) => {
    log.error('FAILURE INITIALIZING PATTERN RECOGNITION GROUP');
    log.error(message);
    res.status(500).send(message);
  });
});

app.post('/initialize', function (req, res) {
  log.info('initialization request received');
  log.info(req.body);

  slidingWindow.flush();

  if (patternRecognitionGroup.isInitialized) {
    return res.status(200).send('already initialized');
  }

  patternRecognitionGroup.initialize(
    req.body.startingData, 
    req.body.possibleDataValues
  ).then((result) => {
    log.info('PATTERN RECOGNITION GROUP INITIALIZED');
    log.info(result);
    res.status(200).send(result);
  }, (message) => {
    log.error('FAILURE INITIALIZING PATTERN RECOGNITION GROUP');
    log.error(message);
    res.status(500).send(message);
  });
});

app.post('/initializeFromDb', function (req, res) {
  log.info('initialize from db request received');
  log.info(req.body);

  slidingWindow.flush();

  if (patternRecognitionGroup.isInitialized) {
    return res.status(200).send('already initialized');
  }

  patternRecognitionGroup.initializeFromDb(
    req.body.possibleDataValues
  ).then((result) => {
    log.info('PATTERN RECOGNITION GROUP INITIALIZED FROM DB');
    log.info(result);
    res.status(200).send(result);
  }, (message) => {
    log.error('FAILURE INITIALIZING PATTERN RECOGNITION GROUP FROM DB');
    log.error(message);
    res.status(500).send(message);
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
    res.status(200).send(nearestPatternRecognizer);
  });
});

// expose ability to add timestep to sliding window. returns current sliding window
// state 
// @param actionTakenString {string}: string representation of action taken.
//   ex: '1_2_4_3'
// @param score {number} the average drive score for this slidingWindow action at this point in time 
app.put('/addTimeStep', function (req, res) {
  log.info('request to addTimeStep received');
  log.info('req.body');

  res.status(200).send(
    slidingWindow.addTimeStep(req.body.actionKey, req.body.stateKey, req.body.score)
  );
});

// @params none
// given current slidingWindow head, update score for next move that
// equals the slidingWindow tailHead's key
// @return promise that resolves to true or false
app.get('/updateScore', function (req, res) {
  log.info('request to update score for sliding window head received');
  log.info('req.body');

  // TODO: since we can now have many time periods stored from a sliding window,
  //  call update using scores from all time periods the sliding window is filled
  //  for.
  if (!slidingWindow.isFull()) {
    return res.status(500).send(`Sliding window must be full with
      ${slidingWindow.numberOfTimeSteps} elements in order to update score!`);
  }

  const patternRecognizer = 
    patternRecognitionGroup.getPatternRecognizer(
      'pattern_' + slidingWindow.getHead().stateKey
    );

  const driveScores = slidingWindow.getAllDriveScores();

  // ex. nextMove string: '1_3_5_2'. Similar to patternRecognizer key format, but
  // no starting 'pattern_'
  return patternRecognizer.updateNextMoveScores(
    slidingWindow.getTailHead().actionKey, // this might just need to be getHead().actionKey?
    driveScores
  ).then(() => {
    // apply rubber banding if enabled
    return config.rubberBanding.enabled ?
      patternRecognizer.rubberBandActionScores(
        config.rubberBanding.targetScore,
        config.rubberBanding.decay
      ) : null;    
  }).then(() => {
    // only rubber band once
    res.status(200).json({
      startPattern: patternRecognizer.patternToString(),
      actionKey: slidingWindow.getTailHead().actionKey,
      driveScores
    });
  }).catch((message) => {
    res.status(500).send(message);
  });
});

// expose patternRecognizer.getBestNextAction() when given a patternRecognizer
app.post('/bestNextAction', function (req, res) {
  log.info('request for best next action received');
  log.info(req.body);
  
  // first, get the patternRecognizer from patternRecognitionGroup
  const patternRecognizer = 
    patternRecognitionGroup.getPatternRecognizer(req.body.patternString);

  patternRecognizer.getBestNextAction().then((result) => {
    // result format:
    // { score: {number}, next_action: {string (ex: '1_3_5')}}
    res.status(200).send(result);
  });
});

// expose patternRecognitionGroup.splitPatternRecognizer() when given
// originalPatternRecognizerString and a new point (fitting nDimensionalPointSchema)
app.post('/splitPatternRecognizer', function(req, res) {
  log.info('request to split pattern recognizer received');
  log.info(req.body);

  if (patternRecognitionGroup.getNumberOfPatterns() > config.maxPatterns) {
    return res.status(500).send('Maximum number of patterns already created!');
  }

  patternRecognitionGroup.splitPatternRecognizer(
    req.body.originalPatternRecognizerString, req.body.newPoint).then((result) => {
      res.status(200).send(result);
    }, (message, err) => {
      res.status(500).send(String(message));
    });
});

// expose method to clear db
app.delete('/db', function (req, res) {
  dbUtil.emptyDb().then(() => {
    log.info('DB CLEARED');
    res.status(200).send('DB CLEARED');
  }, () => {
    log.error('FAILURE CLEARING DB');
    res.status(500).send('FAILURE CLEARING DB');
  });  
});

// expose method to get updates per minute
app.post('/updatesPerMinute', function (req, res) {
  log.info('request for updates per minute received');
  log.info(req.body);

  // first, get the patternRecognizer from patternRecognitionGroup
  const patternRecognizer = 
    patternRecognitionGroup.getPatternRecognizer(req.body.patternString);

  patternRecognizer.getUpdatesPerMinute().then((result) => {
    res.status(200).json({ updatesPerMinute: result });
  });
});


// TODO: expose method to delete an individual patternRecognizer

// TODO: expose method that returns an array of all points in global points table

// serve static client files
app.use(express.static('client'));
log.info('Ihtai server running on port 3800');
app.listen(3800);
