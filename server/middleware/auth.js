const crypto = require('crypto');
const mozlog = require('../log');
const storage = require('../storage');
const fxa = require('../fxa');
const log = mozlog('send.auth');

const get_valid_meta = async function(storage, req) {
  if (!req.meta) {
    const id = req.params.id;
    if (id) {
      req.meta = await storage.metadata(id);
    }
  }
  if (req.meta && !req.meta.dead) {
    return req.meta;
  }

  return null;
};

const get_auth_info = function(req) {
  const authHeader = req.header('Authorization');
  if (authHeader) {
    return authHeader.split(' ', 2);
  }
  return [null, null];
};

const test_auth_fxa = async function(meta, req, auth_type, auth_value) {
  if (auth_type == 'Bearer' && auth_value) {
    req.user = await fxa.verify(auth_value);
  }

  if (req.user) {
    if (meta && meta.user) {
      const metaAuth = Buffer.from(meta.user, 'utf8');
      const userAuth = Buffer.from(req.user, 'utf8');
      return crypto.timingSafeEqual(metaAuth, userAuth);
    }
  }

  return false;
};

const test_auth_hmac = async function(
  meta,
  storage,
  req,
  res,
  auth_type,
  auth_value
) {
  if (auth_type == 'send-v1' && auth_value) {
    if (meta && meta.auth && meta.nonce) {
      const hmac = crypto.createHmac(
        'sha256',
        Buffer.from(meta.auth, 'base64')
      );
      hmac.update(Buffer.from(meta.nonce, 'base64'));
      const verifyHash = hmac.digest();
      if (
        crypto.timingSafeEqual(verifyHash, Buffer.from(auth_value, 'base64'))
      ) {
        req.nonce = crypto.randomBytes(16).toString('base64');
        storage.setField(meta.id, 'nonce', req.nonce);
        res.set('WWW-Authenticate', `send-v1 ${req.nonce}`);
        return true;
      } else {
        res.set('WWW-Authenticate', `send-v1 ${meta.nonce}`);
      }
    } else {
      res.set('WWW-Authenticate', `send-v1 ${meta.nonce}`);
    }
  }
  return false;
};

const test_auth_dlToken = async function(meta, auth_type, auth_value) {
  if (auth_type == 'Bearer' && auth_value) {
    return await meta.verifyDownloadToken(auth_value);
  }
  return false;
};

const test_auth_owner = async function(meta, req) {
  const ownerToken = req.body.owner_token;
  if (ownerToken && meta.owner) {
    const metaOwner = Buffer.from(meta.owner, 'utf8');
    const owner = Buffer.from(ownerToken, 'utf8');
    if (metaOwner.length > 0 && metaOwner.length === owner.length) {
      return crypto.timingSafeEqual(metaOwner, owner);
    }
  }
  return false;
};

module.exports = {
  hmac: async function(req, res, next) {
    try {
      const [auth_type, token] = get_auth_info(req);
      if (token) {
        const meta = await get_valid_meta(storage, req);
        if (!meta) {
          return res.sendStatus(404);
        }

        req.authorized = await test_auth_hmac(
          meta,
          storage,
          req,
          res,
          auth_type,
          token
        );

        if (!req.authorized) {
          // always allow FxA-authenticated users to see their data
          req.authorized = await test_auth_fxa(meta, req, auth_type, token);
        }
      }
    } catch (e) {
      log.warn('hmac', e);
      req.authorized = false;
    }

    if (req.authorized) {
      next();
    } else {
      res.sendStatus(401);
    }
  },
  owner: async function(req, res, next) {
    try {
      const meta = await get_valid_meta(storage, req);
      if (!meta) {
        return res.sendStatus(404);
      }

      req.authorized = await test_auth_owner(meta, req);

      if (!req.authorized) {
        const [auth_type, token] = get_auth_info(req);
        if (token) {
          // always allow FxA-authenticated users to see their data
          req.authorized = await test_auth_fxa(meta, req, auth_type, token);
        }
      }
    } catch (e) {
      log.warn('owner', e);
      req.authorized = false;
    }

    if (req.authorized) {
      next();
    } else {
      res.sendStatus(401);
    }
  },
  fxa: async function(req, res, next) {
    try {
      const [auth_type, token] = get_auth_info(req);
      if (token) {
        const meta = await get_valid_meta(storage, req);
        if (!meta) {
          return res.sendStatus(404);
        }

        req.authorized = await test_auth_fxa(meta, req, auth_type, token);
      }
    } catch (e) {
      log.warn('fxa', e);
      req.authorized = false;
    }

    if (req.authorized) {
      next();
    } else {
      res.sendStatus(401);
    }

    next();
  },
  dlToken: async function(req, res, next) {
    try {
      const [auth_type, token] = get_auth_info(req);
      if (token) {
        const meta = await get_valid_meta(storage, req);
        if (!meta) {
          return res.sendStatus(404);
        }

        req.authorized = await test_auth_dlToken(meta, auth_type, token);

        if (!req.authorized) {
          // try with HMAC next, since that was how it used to be
          req.authorized = await test_auth_hmac(
            meta,
            storage,
            req,
            res,
            auth_type,
            token
          );
        }

        if (!req.authorized) {
          // always allow FxA-authenticated users to see their data
          req.authorized = await test_auth_fxa(meta, req, auth_type, token);
        }
      }
    } catch (e) {
      log.warn('dlToken', e);
      req.authorized = false;
    }

    if (req.authorized) {
      next();
    } else {
      res.sendStatus(401);
    }
  }
};
