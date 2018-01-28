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
    // The larger the dampening value, the weaker rubber banding effect is. Default of 20.
    // Lower values result in more frantic cycling of possible actions.
    dampeningValue: /* 800 */ 20,
    // The score that all action scores are pulled towards.
    targetScore: 10
  },
  maxPatterns: 1000,
  // note that increasing sliding window size increases the 
  // time it takes for learning to take effect. don't use
  // a smaller value than 3
  slidingWindowSize: 30,
  moveUpdates: {
    // successful values for balldemo have been 4/5, 9/10, and 15/16
    // lower values have more "jagged" movement patterns. Higher is smoother.
    originalScoreWeight: 9
  }
};
