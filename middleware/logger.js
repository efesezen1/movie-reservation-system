const morgan = require('morgan');

// HTTP request logger: dev format (method, url, status, response time)
module.exports = morgan('dev');
