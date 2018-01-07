'use strict';

const bunyan = require('bunyan');
const conf = require('config');
const RotatingStream = require('logrotate-stream');

let logStream;

if (conf.has('log.file')) {
  const filepath = conf.get('log.file');
  if (conf.has('log.rotate')) {
    logStream = {
      stream: new RotatingStream({
        file: filepath,
        size: conf.get('log.rotate.maxSize'),
        keep: conf.get('log.rotate.maxFiles'),
        compress: true
      })
    };
  } else {
    logStream = {
      path: filepath
    };
  }
} else {
  logStream = {
    stream: process.stdout
  };
}
logStream.level = conf.get('log.level');

const loggingStreams = [logStream];

module.exports = bunyan.createLogger({
  name: 'main',
  serializers: bunyan.stdSerializers,
  streams: loggingStreams,
  level: conf.log.level
});
