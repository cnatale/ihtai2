const Memcached = require('memcached');
const conf = require('config');
const net = require('net');

const monitorPort = function(host, port) {
  const server = net.createConnection({ port, host });

  server.on('end', () => {
    console.log(`Memcached is no longer running at ${host}:${port}`);
  });

  server.on('error', () => {
    console.log(`Memcached is not running at ${host}:${port}`);
  });
};

const memcachedHost = conf.get('caching.host');
const memcachedPort = conf.get('caching.port');

// makes sure memcached is running at host:port
monitorPort(memcachedHost, memcachedPort);

const connection = `${memcachedHost}:${memcachedPort}`;

module.exports = new Memcached(connection);
