const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const qs = require('qs');
chai.use(chaiAsPromised);
const expect = chai.expect;
const main = require('../../../server/main');
const app = main;
const dbUtil = require('../../../server/db/util');


describe('main', () => {
  before(() => {
    return dbUtil.emptyDb();
  });

  after(() => {
    return dbUtil.emptyDb();
  });

  describe('/initialize', () => {
    it('should instantiate a patternRecognitionGroup and slidingWindow', (done) => {
      request(app)
        .post('/initialize')
        .send({
          startingData: [
            { inputState:[5], actionState: [5], driveState: [5] },
            { inputState: [10], actionState: [10], driveState: [10] },
            { inputState:[0], actionState: [15], driveState: [0] },
            { inputState: [20], actionState: [20], driveState: [20] }
          ],
          possibleDataValues: [
            [0, 5, 10, 15, 20]
          ]
        })
        .expect(200)
        .end(function(err, res) {
          if (err) { throw err; }

          // expect(res.text).to.equal('PATTERN RECOGNITION GROUP INITIALIZED');
          expect(res.text).to.equal('[true,true,true,true]');
          done();
        });
    });
  });

  describe('/nearestPatternRecognizer', () => {
    it('should get the nearest PatternRecognizer, given a pattern', (done) => {
      request(app)
        .post('/nearestPatternRecognizer')
        .send({ inputState:[4], actionState: [6], driveState: [6] })
        .expect(200)
        .end(function(err, res) {
          if (err) { throw err; }

          expect(res.text).to.equal('pattern_5_5_5');
          done();
        });
    });
  });

  describe('/addTimeStep', () => {
    it('add a timeStep to sliding window', (done) => {
      request(app)
        .put('/addTimeStep')
        .send({ actionKey: '5', stateKey: '5_5_5', score: 1 })
        .expect(200)
        .then((res) => {
          expect(res.text).to.equal('[{"actionKey":"5","stateKey":"5_5_5","score":1}]');
          done();
        });
    });
  });


  describe('/updateScore', () => {
    it('returns 500 until sliding window is full', (done) => {
      request(app)
        .put('/addTimeStep')
        .send({ actionKey: '10', stateKey: '10_10_10', score: 2 })
        .expect(200)
        .then(() => {
          request(app).get('/updateScore')
            .expect(500)
            .then(() => { done(); });
        });    
    });

    it('returns 200 once sliding window is full', (done) => {
      request(app)
        .put('/addTimeStep')
        .send({ actionKey: '10', stateKey: '10_10_10', score: 2 })
        .expect(200)
        .then(() => request(app).put('/addTimeStep')
          .send({ actionKey: '10', stateKey: '10_10_10', score: 2 })
          .expect(200))
        .then(() => request(app).put('/addTimeStep')
          .send({ actionKey: '10', stateKey: '10_10_10', score: 2 })
          .expect(200))
        .then(() => request(app).put('/addTimeStep')
          .send({ actionKey: '10', stateKey: '10_10_10', score: 2 })
          .expect(200))
        .then(() => request(app).put('/addTimeStep')
          .send({ actionKey: '10', stateKey: '10_10_10', score: 2 })
          .expect(200))
        .then(() => request(app).get('/updateScore')
          .expect(200))
        .then(() => { done(); });
    });
  });

  describe('/bestNextAction', () => {
    it('gets the best next action', (done) => {
      request(app)
        .post('/bestNextAction')
        .send({ patternString: 'pattern_5_5_5' })
        .expect(200)
        .then((res) => {
          const responseObject = JSON.parse(res.text);
          expect(responseObject).to.be.an('object');
          expect(responseObject.next_action).to.be.a('string');
          done();
        });
    });
  });


  describe('/updatesPerMinute', () => {
    // TODO: get updates per minute for patternRecognizer
    // equation: updates/min = (update_count) / (currentTime - update_count_last_reset) 
  });

  describe('/splitPatternRecognizer', () => {
    it('should return true if the split was successful', (done) => {
      request(app)
        .post('/splitPatternRecognizer')
        .send({
          originalPatternRecognizerString: 'pattern_5_5_5',
          newPoint: { inputState: [6], actionState: [6], driveState: [6] }
        })
        .expect(200)
        .then(() => {
          done();
        });
    });

    it('should return 500 if newPoint format is incorrect', (done) => {
      request(app)
        .post('/splitPatternRecognizer')
        .send({
          originalPatternRecognizerString: 'pattern_5_5_5',
          newPoint: {}
        })
        .expect(500)
        .then(() => {
          done();
        });
    });

    it('should return 500 if split pattern is already a patternRecognizer', (done) => {
      request(app)
        .post('/splitPatternRecognizer')
        .send({
          originalPatternRecognizerString: 'pattern_5_5_5',
          newPoint: { inputState: [20], actionState: [20], driveState: [20] }
        })
        .expect(500)
        .then(() => {
          done();
        });
    });
  });

  describe('/patternRecognizer/delete', () => {
    // TODO: delete a given patternRecognizer
  });

  describe('delete /db', () => {
    // empties all db tables
  });

  describe('/allPoints', () => {
    // returns an array of all points in the global points table
  });
});
