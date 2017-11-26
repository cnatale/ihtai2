const SlidingWindow = require('./sliding-window/sliding-window');
const PatternRecognitionGroup = require('./pattern-recognition/pattern-recognition-group');
const dbUtil = require('./db/util');
const bunyan = require('bunyan');
const log = bunyan.createLogger({ name: 'Ihtai' });

const express = require('express');
const app = express();

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

app.delete('/clearDB', function (req, res) {
  dbUtil.emptyDb().then(() => {
    log.info('DB CLEARED');
    res.send('DB CLEARED');
  }, () => {
    log.error('FAILURE CLEARING DB');
    res.send('FAILURE CLEARING DB');
  });  
});



app.listen(3800);
