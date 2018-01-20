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
    // The larger the dampening value, the weaker rubber banding effect is.
    dampeningValue: 20,
    // The score that all action scores are pulled towards.
    targetScore: 1
  }
};
