const assert = require('assert');
const { EventEmitter } = require('events');
const { Readable } = require('stream');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

// Mimics the parts of a `ws` WebSocket that the upload route uses, including
// how createWebSocketStream feeds messages into a stream and ends it on close.
class FakeSocket extends EventEmitter {
  constructor() {
    super();
    this.readyState = 1;
    this.sent = [];
  }

  static createWebSocketStream(ws) {
    const stream = new Readable({ read() {} });
    ws.on('message', message => stream.push(message));
    ws.once('close', () => stream.push(null));
    return stream;
  }

  send(data) {
    this.sent.push(JSON.parse(data));
  }

  close() {
    this.readyState = 2;
  }

  // The client going away, with the given close code.
  disconnect(code) {
    this.readyState = 3;
    this.emit('close', code);
  }
}

const storage = {
  // Behaves like a storage backend: consumes the stream, resolves when it ends
  // and rejects when it errors.
  set: sinon.stub().callsFake(
    (id, stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString()));
        stream.on('error', reject);
      })
  )
};

const fxa = {
  verify: sinon.stub().resolves(null)
};

const log = {
  error: sinon.stub(),
  info: sinon.stub()
};

const config = {
  default_expire_seconds: 300,
  default_downloads: 1,
  max_file_size: 1024 * 1024,
  max_expire_seconds: 86400,
  max_downloads: 100,
  fxa_required: false,
  deriveBaseUrl: () => 'https://send.example.com'
};

const wsRoute = proxyquire('../../server/routes/ws', {
  '../storage': storage,
  '../config': config,
  '../fxa': fxa,
  '../log': () => log
});

const EOF = Buffer.from([0]);

function tick() {
  return new Promise(resolve => setImmediate(resolve));
}

async function startUpload(ws) {
  wsRoute(ws, {});
  ws.emit(
    'message',
    JSON.stringify({
      fileMetadata: 'metadata',
      authorization: 'send-v1 verifier',
      timeLimit: 300,
      dlimit: 1
    })
  );
  // Let the route authenticate the upload and start storing it.
  await tick();
}

describe('/api/ws', function() {
  afterEach(function() {
    storage.set.resetHistory();
    fxa.verify.resetHistory();
    log.error.resetHistory();
  });

  it('stores the upload and replies ok once the EOF marker is received', async function() {
    const ws = new FakeSocket();
    await startUpload(ws);
    ws.emit('message', Buffer.from('hello'));
    ws.emit('message', EOF);

    assert.equal(await storage.set.firstCall.returnValue, 'hello');
    await tick();
    assert.deepEqual(ws.sent[ws.sent.length - 1], { ok: true });
    sinon.assert.notCalled(log.error);
  });

  it('aborts storing when the client disconnects before the EOF marker', async function() {
    const ws = new FakeSocket();
    await startUpload(ws);
    ws.emit('message', Buffer.from('hello'));
    ws.disconnect(1001);

    await assert.rejects(storage.set.firstCall.returnValue);
    await tick();
    assert.ok(!ws.sent.some(reply => reply.ok));
    sinon.assert.notCalled(log.error);
  });

  it('aborts storing when the client closes normally before the EOF marker', async function() {
    const ws = new FakeSocket();
    await startUpload(ws);
    ws.emit('message', Buffer.from('hello'));
    ws.disconnect(1000);

    await assert.rejects(storage.set.firstCall.returnValue);
  });

  it('keeps the upload when the client disconnects after the EOF marker', async function() {
    const ws = new FakeSocket();
    await startUpload(ws);
    ws.emit('message', Buffer.from('hello'));
    ws.emit('message', EOF);
    ws.disconnect(1001);

    assert.equal(await storage.set.firstCall.returnValue, 'hello');
    sinon.assert.notCalled(log.error);
  });

  it('does not start storing when the client disconnects during authentication', async function() {
    let authenticated;
    fxa.verify.returns(new Promise(resolve => (authenticated = resolve)));
    const ws = new FakeSocket();
    await startUpload(ws);
    ws.disconnect(1001);
    authenticated(null);
    await tick();

    sinon.assert.notCalled(storage.set);
    fxa.verify.resolves(null);
  });
});
