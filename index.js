var Server = require('./server');
var config = require('./config');

var server = new Server(config);
server.start();
