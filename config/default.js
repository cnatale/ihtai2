module.exports = {
  mysql: {
    host: '',
    user: '',
    password: ''
  },
  log: {
    level: 'info',
    rotate: {
      maxSize: '1g',
      maxFiles: 10
    }
  },
  db: {
    globalPointsTableName: 'global_points_table',
    type: 'mysql'
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
    scoreTimesteps: [ 30, 60, 90, 120, 150, 180, 210, 240, 270, 300 ]
  },
  moveUpdates: {
    // successful values for balldemo have been 4/5, 9/10, and 15/16
    // lower values have more "jagged" movement patterns. Higher is smoother.
    originalScoreWeight: 9
  }
};
