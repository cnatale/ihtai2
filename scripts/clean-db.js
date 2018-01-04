const log = require('../log');
const dbUtil = require('../server/db/util');

dbUtil.emptyDb(true).then(function() {
  log.info('Database successfully cleaned.');
  process.exit(0);
}).catch((reason) => {
  log.error('Database clean failed. Reason: ' + reason);
  log.error('Note that this will happen when knexCleaner.clean is run on nonexistent db.');
  process.exit(1);
});
