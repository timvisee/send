const conf = require('./config');

const isProduction = conf.env === 'production';

const mozlog = require('mozlog')({
  ...conf.log,
  debug: !isProduction
});

module.exports = mozlog;
