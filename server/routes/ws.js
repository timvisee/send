const crypto = require('crypto');
const storage = require('../storage');
const config = require('../config');
const mozlog = require('../log');
const Limiter = require('../limiter');
const fxa = require('../fxa');
const { encryptedSize } = require('../../app/utils');

const { Transform } = require('stream');

const log = mozlog('send.upload');

module.exports = function(ws, req) {
  let fileStream;
  let eofReceived = false;
  let cancelled = false;

  ws.on('close', () => {
    if (eofReceived) {
      return;
    }
    // The client went away before sending the whole file. Error the stream so
    // the storage backend aborts the upload and cleans up what it stored.
    cancelled = true;
    if (fileStream !== undefined) {
      fileStream.destroy(new Error('Upload cancelled'));
    }
  });

  ws.once('message', async function(message) {
    try {
      const newId = crypto.randomBytes(8).toString('hex');
      const owner = crypto.randomBytes(10).toString('hex');

      const fileInfo = JSON.parse(message);
      const timeLimit = fileInfo.timeLimit || config.default_expire_seconds;
      const dlimit = fileInfo.dlimit || config.default_downloads;
      const metadata = fileInfo.fileMetadata;
      const auth = fileInfo.authorization;
      const user = await fxa.verify(fileInfo.bearer);
      if (cancelled) {
        return;
      }
      const maxFileSize = config.max_file_size;
      const maxExpireSeconds = config.max_expire_seconds;
      const maxDownloads = config.max_downloads;

      if (config.fxa_required && !user) {
        ws.send(
          JSON.stringify({
            error: 401
          })
        );
        return ws.close();
      }
      if (
        !metadata ||
        !auth ||
        timeLimit <= 0 ||
        timeLimit > maxExpireSeconds ||
        dlimit > maxDownloads
      ) {
        ws.send(
          JSON.stringify({
            error: 400
          })
        );
        return ws.close();
      }

      const meta = {
        owner,
        metadata,
        dlimit,
        auth: auth.split(' ')[1],
        nonce: crypto.randomBytes(16).toString('base64')
      };

      const url = `${config.deriveBaseUrl(req)}/download/${newId}/`;

      ws.send(
        JSON.stringify({
          url,
          ownerToken: meta.owner,
          id: newId
        })
      );
      const limiter = new Limiter(encryptedSize(maxFileSize));
      const eof = new Transform({
        transform: function(chunk, encoding, callback) {
          if (chunk.length === 1 && chunk[0] === 0) {
            eofReceived = true;
            this.push(null);
          } else {
            this.push(chunk);
          }
          callback();
        }
      });
      const wsStream = ws.constructor.createWebSocketStream(ws);

      fileStream = wsStream.pipe(eof).pipe(limiter); // limiter needs to be the last in the chain

      await storage.set(newId, fileStream, meta, timeLimit);

      // The client may have left after sending the whole file, in which case
      // the upload is complete but there is nobody left to tell.
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ ok: true }));
      }
    } catch (e) {
      if (!cancelled) {
        log.error('upload', e);
      }
      if (ws.readyState === 1) {
        ws.send(
          JSON.stringify({
            error: e === 'limit' ? 413 : 500
          })
        );
      }
    }
    ws.close();
  });
};
