const assert = require('assert');
const crypto = require('crypto');
const mozlog = require('../log');
const storage = require('../storage');
const fxa = require('../fxa');
const log = mozlog('send.auth');

module.exports = {
  hmac: async function(req, res, next) {
    const id = req.params.id;
    const authHeader = req.header('Authorization');
    if (id && authHeader) {
      try {
        const auth = authHeader.split(' ')[1];
        const meta = await storage.metadata(id);
        if (!meta) {
          return res.sendStatus(404);
        }
        const hmac = crypto.createHmac(
          'sha256',
          Buffer.from(meta.auth, 'base64')
        );
        hmac.update(Buffer.from(meta.nonce, 'base64'));
        const verifyHash = hmac.digest();
        if (crypto.timingSafeEqual(verifyHash, Buffer.from(auth, 'base64'))) {
          req.nonce = crypto.randomBytes(16).toString('base64');
          storage.setField(id, 'nonce', req.nonce);
          res.set('WWW-Authenticate', `send-v1 ${req.nonce}`);
          req.authorized = true;
          req.meta = meta;
        } else {
          res.set('WWW-Authenticate', `send-v1 ${meta.nonce}`);
          req.authorized = false;
        }
      } catch (e) {
        log.warn('hmac', e);
        req.authorized = false;
      }
    }
    if (req.authorized) {
      next();
    } else {
      res.sendStatus(401);
    }
  },
  owner: async function(req, res, next) {
    const id = req.params.id;
    if (id) {
      try {
        req.meta = await storage.metadata(id);
        if (!req.meta) {
          return res.sendStatus(404);
        }

        const ownerToken = req.body.owner_token;
        if (ownerToken) {
          const metaOwner = Buffer.from(req.meta.owner, 'utf8');
          const owner = Buffer.from(ownerToken, 'utf8');
          assert(metaOwner.length > 0);
          assert(metaOwner.length === owner.length);
          req.authorized = crypto.timingSafeEqual(metaOwner, owner);
        } else {
          // re-try for FxA OAuth token...
          const authHeader = req.header('Authorization');
          if (authHeader && /^Bearer\s/i.test(authHeader)) {
            const token = authHeader.split(' ')[1];
            req.user = await fxa.verify(token);
          }

          if (req.user && req.meta.user) {
            const metaAuth = Buffer.from(req.meta.user, 'utf8');
            const userAuth = Buffer.from(req.user, 'utf8');
            req.authorized = crypto.timingSafeEqual(metaAuth, userAuth);
          }
        }
      } catch (e) {
        log.warn('owner', e);
        req.authorized = false;
      }
    }
    if (req.authorized) {
      next();
    } else {
      res.sendStatus(401);
    }
  },
  fxa: async function(req, res, next) {
    const authHeader = req.header('Authorization');
    if (authHeader) {
      const [auth_type, token] = authHeader.split(' ', 2);
      if (auth_type == 'Bearer') {
        req.user = await fxa.verify(token);
      } else if (auth_type == 'send-v1') {
        return await this.hmac(req, res, next);
      }
    }

    if (!req.user) {
      log.warn('fxa', { msg: 'Token invalid or expired' });
      return res.sendStatus(401);
    }

    // handle permissions...
    const id = req.params.id;
    if (id) {
      // a request to a file...
      const meta = await storage.metadata(id);
      if (!meta || !meta.user) {
        return res.sendStatus(404);
      }

      const metaAuth = Buffer.from(meta.user, 'utf8');
      const userAuth = Buffer.from(req.user, 'utf8');
      if (!crypto.timingSafeEqual(metaAuth, userAuth)) {
        log.warn('fxa', { msg: 'User not allowed to view file' });
        return res.sendStatus(403);
      }

      req.meta = meta;
    }

    next();
  },
  dlToken: async function(req, res, next) {
    const authHeader = req.header('Authorization');
    if (authHeader && /^Bearer\s/i.test(authHeader)) {
      const token = authHeader.split(' ')[1];
      const id = req.params.id;
      req.meta = await storage.metadata(id);
      if (!req.meta || req.meta.dead) {
        return res.sendStatus(404);
      }
      req.authorized = await req.meta.verifyDownloadToken(token);
    }
    if (req.authorized) {
      next();
    } else {
      res.sendStatus(401);
    }
  }
};
