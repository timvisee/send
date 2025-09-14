'use strict';

const path = require('path');

const genmap = require('./generate_asset_map');
const isServer = typeof genmap === 'function';
let prefix = '';
let manifest = {};
try {
  //eslint-disable-next-line node/no-missing-require
  manifest = require('../dist/manifest.json');
} catch (e) {
  // use middleware
}

const assets = isServer ? manifest : genmap;

function getAsset(name) {
  return prefix + assets[name];
}

function setPrefix(name) {
  prefix = name;
}

function getMatches(match) {
  return Object.keys(assets)
    .filter((k) => match.test(k))
    .map(getAsset);
}

const instance = {
  setPrefix: setPrefix,
  get: getAsset,
  match: getMatches,

  // === Only this block changed to support WDS v3/v4 shapes ===
  setMiddleware: function (middleware) {
    // Normalize various shapes:
    // - WDS v4: middleware.context.{outputFileSystem,getFilenameFromURL,compiler}
    // - Older: middleware.fileSystem, middleware.getFilenameFromUrl
    function resolveFsAndHelpers(mw) {
      const ctx = mw && (mw.context || mw);

      const fs = (ctx && (ctx.outputFileSystem || ctx.fileSystem)) || null;

      const getFilenameFromURL =
        (ctx && (ctx.getFilenameFromURL || ctx.getFilenameFromUrl)) || null;

      // When getFilenameFromURL is missing, fall back to compiler.outputPath
      const compiler =
        (ctx && (ctx.compiler || (ctx.context && ctx.context.compiler))) ||
        null;

      const outputPath = compiler && compiler.outputPath;

      return { fs, getFilenameFromURL, outputPath };
    }

    // hide Node require from bundlers
    function safeRequireFs() {
      try {
        // eslint-disable-next-line no-eval
        const req = eval('require');
        return req && req('fs');
      } catch (_) {
        return null;
      }
    }

    function getManifest() {
      const { fs, getFilenameFromURL, outputPath } =
        resolveFsAndHelpers(middleware);
      // If WDS memfs isn't present yet, fall back to disk in Node; otherwise return empty
      if (!fs) {
        if (
          typeof process !== 'undefined' &&
          process.versions &&
          process.versions.node
        ) {
          const nfs = safeRequireFs();
          if (nfs) {
            const disk = path.resolve(__dirname, '..', 'dist', 'manifest.json');
            return JSON.parse(nfs.readFileSync(disk, 'utf8'));
          }
        }
        return {};
      }

      const filename =
        typeof getFilenameFromURL === 'function'
          ? getFilenameFromURL('/manifest.json')
          : outputPath && path.join(outputPath, 'manifest.json');

      if (!filename) {
        if (
          typeof process !== 'undefined' &&
          process.versions &&
          process.versions.node
        ) {
          const nfs = safeRequireFs();
          if (nfs) {
            const disk = path.resolve(__dirname, '..', 'dist', 'manifest.json');
            return JSON.parse(nfs.readFileSync(disk, 'utf8'));
          }
        }
        return {};
      }

      return JSON.parse(fs.readFileSync(filename).toString());
    }

    if (middleware) {
      instance.get = function getAssetWithMiddleware(name) {
        const m = getManifest();
        return prefix + (m[name] || name);
      };
      instance.match = function matchAssetWithMiddleware(match) {
        const m = getManifest();
        return Object.keys(m)
          .filter((k) => match.test(k))
          .map((k) => prefix + m[k]);
      };
    }
  },
};

module.exports = instance;
