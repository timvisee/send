const config = require('./config');
const layout = require('./layout');
const assets = require('../common/assets');
const getTranslator = require('./locale');
const mozlog = require('./log');
const { getFxaConfig } = require('./fxa');
const log = mozlog('send.download');

module.exports = async function(req) {
  const locale = req.language || 'en-US';
  let authConfig = null;
  let robots = 'none';
  if (req.route && req.route.path === '/') {
    robots = 'all';
  }
  if (config.fxa_client_id) {
    try {
      authConfig = await getFxaConfig();
      authConfig.client_id = config.fxa_client_id;
      authConfig.fxa_required = config.fxa_required;
      authConfig.jwe_required = config.jwe_required;
    } catch (e) {
      if (config.fxa_required) {
        log.error(
          'fxa_client_id + fxa_required are set but no config was found',
          e
        );
        throw e;
      } else {
        log.warn('fxa_client_id is set but no config was found', e);
      }
    }
  }
  const prefs = {};
  if (config.survey_url) {
    prefs.surveyUrl = config.survey_url;
  }
  const baseUrl = config.deriveBaseUrl(req);
  const uiAssets = {
    android_chrome_192px: assets.get('android-chrome-192x192.png'),
    android_chrome_512px: assets.get('android-chrome-512x512.png'),
    apple_touch_icon: assets.get('apple-touch-icon.png'),
    favicon_16px: assets.get('favicon-16x16.png'),
    favicon_32px: assets.get('favicon-32x32.png'),
    icon: assets.get('icon.svg'),
    safari_pinned_tab: assets.get('safari-pinned-tab.svg'),
    facebook: baseUrl + '/' + assets.get('send-fb.jpg'),
    twitter: baseUrl + '/' + assets.get('send-twitter.jpg'),
    wordmark: assets.get('wordmark.svg') + '#logo'
  };
  Object.keys(uiAssets).forEach(index => {
    if (config.ui_custom_assets[index] !== '')
      uiAssets[index] = config.ui_custom_assets[index];
  });
  return {
    archive: {
      numFiles: 0
    },
    locale,
    capabilities: { account: false },
    translate: getTranslator(locale),
    title: 'Send',
    description:
      'Encrypt and send files with a link that automatically expires to ensure your important documents don’t stay online forever.',
    baseUrl,
    ui: {
      colors: {
        primary: config.ui_color_primary,
        accent: config.ui_color_accent
      },
      assets: uiAssets
    },
    storage: {
      files: []
    },
    fileInfo: {},
    cspNonce: req.cspNonce,
    user: { avatar: assets.get('user.svg'), loggedIn: false },
    robots,
    authConfig,
    prefs,
    layout
  };
};
