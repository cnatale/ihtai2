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
    globalPointsTableName: 'global_points_table'
  }
};
