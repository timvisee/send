const assets = require('../../common/assets');
const routes = require('../routes');
const pages = require('../routes/pages');
const tests = require('../../test/frontend/routes');
const express = require('express');
const expressWs = require('@dannycoates/express-ws');
const morgan = require('morgan');
const config = require('../config');

const ID_REGEX = '([0-9a-fA-F]{10,16})';

module.exports = function (app, devServer) {
  if (!devServer) throw new Error('devServer missing');

  // WDS4 (webpack-dev-middleware v5) exposes .middleware.context
  // Fallbacks cover older shapes just in case
  const dmw = devServer.middleware;
  const fs =
    (dmw && dmw.context && dmw.context.outputFileSystem) ||
    (dmw && dmw.outputFileSystem) ||
    (devServer.compiler && devServer.compiler.outputFileSystem);

  const getFilenameFromUrl =
    (dmw && dmw.context && dmw.context.getFilenameFromURL) ||
    (dmw && dmw.getFilenameFromUrl);

  if (!fs || !getFilenameFromUrl) {
    throw new Error('Cannot access in-memory filesystem from dev middleware');
  }

  // Still let assets helper read from dev middleware
  assets.setMiddleware(dmw);

  // WebSocket sidecar
  const wsapp = express();
  expressWs(wsapp, null, { perMessageDeflate: false });
  routes(wsapp);
  wsapp.ws('/api/ws', require('../routes/ws'));
  wsapp.listen(8081, config.listen_address);

  app.use(morgan('dev', { stream: process.stderr }));

  function android(req, res) {
    const index = fs
      .readFileSync(getFilenameFromUrl('/android.html'))
      .toString();
    res.set('Content-Type', 'text/html');
    res.send(index);
  }

  if (process.env.ANDROID) {
    app.get('/', android);
    app.get(`/share/:id${ID_REGEX}`, android);
    app.get('/completed', android);
    app.get('/preferences', android);
    app.get('/options', android);
    app.get('/oauth', android);
  }

  routes(app);
  tests(app);

  process.nextTick(() => app.use(pages.notfound));
};
