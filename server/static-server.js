// Testing to see if breaking the static html server into its own node server instance improves performance.
const express = require('express');
const app = express();
const bunyan = require('bunyan');
const config = require('config');
const log = bunyan.createLogger({ name: 'Ihtai' });
log.level(config.log.level);

app.use(express.static('client'));
// log.info('Ihtai static content server running on port 3900');
app.listen(3900);
