const SlidingWindow = require('./sliding-window/sliding-window');
const PatternRecognitionGroup = require('./pattern-recognition/pattern-recognition-group');
const dbUtil = require('./db/util');
const bunyan = require('bunyan');
const config = require('config');

const serverLog = bunyan.createLogger({
  name: 'IhtaiServer',
  streams: [
    {
      level: 'error',
      stream: process.stdout            // log INFO and above to stdout
    },
    {
      level: 'info',
      path: './log/ihtai-server.log'
    }
  ]
});
const clientLog = bunyan.createLogger({
  name: 'IhtaiClient',
  streams: [
    {
      level: 'info',
      path: './log/ihtai-client.log'
    }
  ]
});

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const argv = require('minimist')(process.argv.slice(2));

let totalCycles = 0;
// current accepted command line arguments:
// rubberBandingTargetScore {number}
// rubberBandingDecay {number}
// originalScoreWeight {number} (referenced in pattern-recognizer.updateNextMoveScores())
// maxPatterns, {number}
// scoreTimesteps (pass in the form of 'timeSteps=30,60,90,120' etc.) {comma-separated numbers}
// slidingWindowSize {number}

const maxPatterns = argv.maxPatterns || config.maxPatterns;

const scoreTimesteps =
  argv.scoreTimesteps ?
    (() => {
      if (typeof argv.scoreTimesteps === 'number') {
        return [  argv.scoreTimesteps ];
      }
      return argv.scoreTimesteps.split(',').map((timestep) => Number(timestep));
    })() : config.slidingWindow.scoreTimesteps;

const slidingWindowSize = argv.slidingWindowSize || config.slidingWindow.size;
const rubberBandingTargetScore = argv.rubberBandingTargetScore || config.rubberBanding.targetScore;
const rubberBandingDecay = argv.rubberBandingDecay || config.rubberBanding.decay;
console.log(`
maxPatterns:${maxPatterns}
scoreTimesteps:${scoreTimesteps}
slidingWindowSize:${slidingWindowSize}
rubberBandingTargetScore:${rubberBandingTargetScore}
rubberBandingDecay:${rubberBandingDecay}
`);

module.exports = app;

// enable cors
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  next();
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// instantiate with number of timesteps stored
const slidingWindow = new SlidingWindow(slidingWindowSize, scoreTimesteps);
const patternRecognitionGroup = new PatternRecognitionGroup();

app.post('/log', function (req, res) {
  clientLog.info(req.body);
  res.status(200).send();
});

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
    // serverLog.debug('PATTERN RECOGNITION GROUP INITIALIZED');
    res.send(result);
  }, (message) => {
    // serverLog.error('FAILURE INITIALIZING PATTERN RECOGNITION GROUP');
    // serverLog.error(message);
    res.status(500).send(message);
  });
});

app.post('/initialize', function (req, res) {
  // serverLog.debug('initialization request received');
  // serverLog.debug(req.body);

  slidingWindow.flush();

  if (patternRecognitionGroup.isInitialized) {
    return res.status(200).send('already initialized');
  }

  patternRecognitionGroup.initialize(
    req.body.startingData,
    req.body.possibleActionValues
  ).then((result) => {
    // serverLog.debug('PATTERN RECOGNITION GROUP INITIALIZED');
    // serverLog.debug(result);
    res.status(200).send(result);
  }, (message) => {
    log.error('FAILURE INITIALIZING PATTERN RECOGNITION GROUP');
    log.error(message);
    res.status(500).send(message);
  });
});

app.post('/initializeFromDb', function (req, res) {
  // serverLog.debug('initialize from db request received');
  // serverLog.debug(req.body);

  slidingWindow.flush();

  if (patternRecognitionGroup.isInitialized) {
    return res.status(200).send('already initialized');
  }

  patternRecognitionGroup.initializeFromDb(
    req.body.possibleActionValues
  ).then((result) => {
    // serverLog.debug('PATTERN RECOGNITION GROUP INITIALIZED FROM DB');
    // serverLog.debug(result);
    res.status(200).send(result);
  }, (message) => {
    // serverLog.error('FAILURE INITIALIZING PATTERN RECOGNITION GROUP FROM DB');
    // serverLog.error(message);
    res.status(500).send(message);
  });
});

/*
  returns the table name of the nearest neighbor pattern
*/
app.post('/nearestPatternRecognizer', function (req, res) {
  // serverLog.debug('request for nearest patternRecognizer received');
  // serverLog.debug(req.body);

  patternRecognitionGroup.getNearestPatternRecognizer(
    {
      inputState: req.body.inputState,
      actionState: req.body.actionState,
      driveState: req.body.driveState
    }
  ).then((nearestPatternRecognizer) => {
    nearestPatternRecognizer ?
      res.status(200).send(nearestPatternRecognizer) :
      res.status(500).send();
  });
});

// expose ability to add timestep to sliding window. returns current sliding window
// state 
// @param actionTakenString {string}: string representation of action taken.
//   ex: '1_2_4_3'
// @param score {number} the average drive score for this slidingWindow action at this point in time 
app.put('/addTimeStep', function (req, res) {
  // serverLog.debug('request to addTimeStep received');
  // serverLog.info(req.body);

  res.status(200).send(
    slidingWindow.addTimeStep(req.body.actionKey, req.body.stateKey, req.body.score)
  );
});

// @params none
// given current slidingWindow head, update score for next move that
// equals the slidingWindow tailHead's key
// @return promise that resolves to true or false
app.get('/updateScore', function (req, res) {
  // serverLog.debug('request to update score for sliding window head received');

  totalCycles++;
  // TODO: since we can now have many time periods stored from a sliding window,
  //  call update using scores from all time periods the sliding window is filled
  //  for.
  if (!slidingWindow.isMinimallyFull()) {
    return res.status(500).send(`Sliding window must be minimally full
      in order to update score!`);
  }

  const patternRecognizer = 
    patternRecognitionGroup.getPatternRecognizer(
      'pattern_' + slidingWindow.getHead().stateKey
    );

  const driveScores = slidingWindow.getAllAverageDriveScores();

  // ex. nextMove string: '1_3_5_2'. Similar to patternRecognizer key format, but
  // no starting 'pattern_'

  // given a state represented by the patternRecognizer, and a certain action represented by
  // slidingWindow.getTailHead().actionKey is taken, what is the result?
  return patternRecognizer.updateNextMoveScores(
    slidingWindow.getTailHead().actionKey,
    driveScores,
    totalCycles
  ).then((bestScore) => {
    // create variable rate of rubberbanding

    // cap score at 80
    // const decayScore = bestScore < 80 ? bestScore : 80;

    // // TODO: make the output range be hyperparameters
    // // right now is always between .00025 and .05
    // const decayRate = (decayScore * (.05 - .002)) / 80 + .002;

    // apply rubber banding if enabled
    // return config.rubberBanding.enabled ?
    //   patternRecognizer.rubberBandActionScores(
    //     rubberBandingTargetScore,
    //     rubberBandingDecay
    //     // totalCycles < 1500 * 200 ? decayRate : /* decayRate * .1 */ .0005
    //   ) : null;
    return null;
  }).then(() => {
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
  // serverLog.debug('request for best next action received');
  // serverLog.debug(req.body);
  
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
  // serverLog.debug('request to split pattern recognizer received');
  // serverLog.debug(req.body);

  if (patternRecognitionGroup.getNumberOfPatterns() > maxPatterns) {
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
    // serverLog.debug('DB CLEARED');
    res.status(200).send('DB CLEARED');
  }, () => {
    // serverLog.error('FAILURE CLEARING DB');
    res.status(500).send('FAILURE CLEARING DB');
  });  
});

// expose method to get updates per minute
app.post('/updatesPerMinute', function (req, res) {
  // serverLog.debug('request for updates per minute received');
  // serverLog.debug(req.body);

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
// app.use(express.static('client'));

app.listen(3800);
console.log('Ihtai server running on port 3800');
