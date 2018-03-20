module.exports = {
  mysql: {
    host: '',
    user: '',
    password: ''
  },
  log: {
    level: 'error',
    rotate: {
      maxSize: '1g',
      maxFiles: 10
    }
  },
  db: {
    globalPointsTableName: 'global_points_table',
    type: 'mysql'
  },
  caching: {
    enabled: false,
    host: 'localhost',
    port: '11211'
  },
  rubberBanding: {
    enabled: true,
    // The score that action scores above targetScore threshold are pulled towards.
    targetScore: 10,
    decay: 0.05
  },
  maxPatterns: 4000,
  // note that increasing sliding window size increases the 
  // time it takes for learning to take effect. don't use
  // a smaller value than 3
  slidingWindow: {
    size: 301,
    scoreTimesteps: [ 30 ]
  },
  moveUpdates: {
    // successful values for balldemo have been 4/5, 9/10, and 15/16
    // lower values have more "jagged" movement patterns. Higher is smoother.
    originalScoreWeight: 9
  }
};
