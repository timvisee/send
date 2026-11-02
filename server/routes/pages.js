const nanotiming = require('nanotiming');
const routes = require('../../app/routes');
const storage = require('../storage');
const state = require('../state');

// choo times every render with nanotiming, which in Node adds entries to the
// global performance timeline that are never cleared. Nothing reads them on the
// server, and they leak heap on every rendered page until we run out of memory.
nanotiming.disabled = true;

function stripEvents(str) {
  // For CSP we need to remove all the event handler placeholders.
  // It's ok, app.js will add them when it attaches to the DOM.
  return str.replace(/\son\w+=""/g, '');
}

module.exports = {
  index: async function(req, res) {
    const appState = await state(req);
    res.send(stripEvents(routes().toString('/blank', appState)));
  },

  blank: async function(req, res) {
    const appState = await state(req);
    res.send(stripEvents(routes().toString('/blank', appState)));
  },

  download: async function(req, res, next) {
    const id = req.params.id;
    const appState = await state(req);
    try {
      const { nonce, pwd } = await storage.metadata(id);
      res.set('WWW-Authenticate', `send-v1 ${nonce}`);
      res.send(
        stripEvents(
          routes().toString(
            `/download/${id}`,
            Object.assign(appState, {
              downloadMetadata: { nonce, pwd }
            })
          )
        )
      );
    } catch (e) {
      next();
    }
  },

  unsupported: async function(req, res) {
    const appState = await state(req);
    res.send(
      stripEvents(
        routes().toString(`/unsupported/${req.params.reason}`, appState)
      )
    );
  },

  notfound: async function(req, res) {
    const appState = await state(req);
    res
      .status(404)
      .send(
        stripEvents(
          routes().toString(
            '/404',
            Object.assign(appState, { downloadMetadata: { status: 404 } })
          )
        )
      );
  }
};
