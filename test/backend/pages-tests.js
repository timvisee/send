const assert = require('assert');
const { performance } = require('perf_hooks');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const storage = {
  metadata: sinon.stub().resolves({ nonce: 'nonce', pwd: false })
};

const pages = proxyquire('../../server/routes/pages', {
  '../storage': storage
});

function request(params = {}) {
  return { params, route: { path: '/' }, cspNonce: 'nonce' };
}

function response() {
  return {
    send: sinon.stub(),
    set: sinon.stub(),
    status: sinon.stub().returnsThis()
  };
}

describe('server-side page rendering', function() {
  // Server-side renders used to leave choo's nanotiming performance.measure()
  // entries in the global performance timeline, leaking heap on every page.
  it('does not grow the global performance timeline', async function() {
    const before = performance.getEntries().length;
    for (let i = 0; i < 10; i++) {
      const indexRes = response();
      await pages.index(request(), indexRes);
      sinon.assert.calledOnce(indexRes.send);

      const downloadRes = response();
      await pages.download(request({ id: 'abcdef0123' }), downloadRes);
      sinon.assert.calledOnce(downloadRes.send);
    }
    assert.strictEqual(performance.getEntries().length, before);
  });
});
