const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const qs = require('qs');
chai.use(chaiAsPromised);
const expect = chai.expect;
const main = require('../../../server/main');
const app = main;


describe('main', () => {
  describe('initialization', () => {
    it('should instantiate a patternRecognitionGroup and slidingWindow', (done) => {
      request(app)
        .post("/initialize")
        .send({
          startingData: [
            { inputState:[5], actionState: [5], driveState: [5] },
            { inputState: [10], actionState: [10], driveState: [10] },
            { inputState:[0], actionState: [15], driveState: [0] },
            { inputState: [20], actionState: [20], driveState: [20] }          
          ],
          possibleDataValues: [
            [0, 5, 10, 15, 20], 
            [0, 5, 10, 15, 20],
            [0, 5, 10, 15, 20]
          ]
        })
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;

          expect(res.text).to.equal('PATTERN RECOGNITION GROUP INITIALIZED');
          done();
        });
    });
  });

  describe('nearestPatternRecognizer', () => {
    it('should get the nearest PatternRecognizer, given a pattern', (done) => {
      request(app)
        .post("/nearestPatternRecognizer")
        .send({ inputState:[4], actionState: [6], driveState: [6] })
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;

          expect(res.text).to.equal('pattern_5_5_5');
          done();
        });
    });
  });

  describe('addTimeStep', () => {
    it('add a timeStep to sliding window', (done) => {
      request(app)
        .put("/addTimeStep")
        .send({ stateKey: '5_5_5', score: 1 })
        .expect(200)
        .then((res) => {
          expect(res.text).to.equal('[{"stateKey":"5_5_5","score":1}]');
          done();
        });
    });
  });


  describe('updateScore', () => {
    it('updates score', (done) => {
      request(app)
        .put("/addTimeStep")
        .send({ stateKey: '10_10_10', score: 2 })
        .expect(200)
        .then(() => {
          request(app)
            .get("/updateScore")
            .expect(200)
            .end(function(err, res) {
              if (err) throw err;

              expect(res.text).to.equal('true');
              done();
            });

        });    
    });
  });

  describe('bestNextAction', () => {
    it('gets the best next action', (done) => {
      request(app)
        .post("/bestNextAction")
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

  describe('delete /db', () => {

  });
});
