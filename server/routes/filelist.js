const crypto = require('crypto');
const config = require('../config');
const storage = require('../storage');
const Limiter = require('../limiter');
const mozlog = require('../log');
const log = mozlog('send.filelist');

function id(user, kid) {
  const sha = crypto.createHash('sha256');
  sha.update(user);
  sha.update(kid);
  const hash = sha.digest('hex');
  return `filelist-${hash}`;
}

module.exports = {
  async get(req, res) {
    const kid = req.params.kid;
    try {
      const fileId = id(req.user, kid);
      const { length, stream } = await storage.get(fileId);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': length
      });
      stream.pipe(res);
    } catch (e) {
      log.warn('get', e);
      res.sendStatus(404);
    }
  },

  async post(req, res) {
    const kid = req.params.kid;
    try {
      const limiter = new Limiter(1024 * 1024 * 10);
      const fileStream = req.pipe(limiter);
      await storage.set(
        id(req.user, kid),
        fileStream,
        null,
        config.max_expire_seconds
      );
      res.sendStatus(200);
    } catch (e) {
      if (e.message === 'limit') {
        return res.sendStatus(413);
      }
      log.warn('post', e);
      res.sendStatus(500);
    }
  }
};
