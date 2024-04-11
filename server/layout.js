const html = require('choo/html');
const assets = require('../common/assets');
const initScript = require('./initScript');

module.exports = function(state, body = '') {
  const custom_css =
    state.ui.assets.custom_css !== ''
      ? html`
          <link
            rel="stylesheet"
            type="text/css"
            href="${state.ui.assets.custom_css}"
          />
        `
      : '';

  return html`
    <!DOCTYPE html>
    <html lang="${state.locale}">
      <head>
        <title>${state.title}</title>
        <base href="/" />
        <meta name="robots" content="${state.robots},noarchive" />
        <meta name="google" content="nositelinkssearchbox" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta property="og:title" content="${state.title}" />
        <meta name="twitter:title" content="${state.title}" />
        <meta name="description" content="${state.description}" />
        <meta property="og:description" content="${state.description}" />
        <meta name="twitter:description" content="${state.description}" />
        <meta name="twitter:card" content="summary" />
        <meta property="og:image" content="${state.ui.assets.facebook}" />
        <meta name="twitter:image" content="${state.ui.assets.twitter}" />
        <meta property="og:url" content="${state.baseUrl}" />
        <meta name="theme-color" content="#220033" />
        <meta name="msapplication-TileColor" content="#220033" />

        <link rel="manifest" href="/app.webmanifest" />
        <link rel="stylesheet" type="text/css" href="/inter.css" />
        <style nonce=${state.cspNonce}>
          :root {
            --color-primary: ${state.ui.colors.primary};
            --color-primary-accent: ${state.ui.colors.accent};
          }
        </style>
        <link
          rel="stylesheet"
          type="text/css"
          href="${assets.get('app.css')}"
        />
        ${custom_css}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="${state.ui.assets.apple_touch_icon}"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="${state.ui.assets.favicon_32px}"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="${state.ui.assets.favicon_16px}"
        />
        <link
          rel="mask-icon"
          href="${state.ui.assets.safari_pinned_tab}"
          color="#838383"
        />
        <script defer src="${assets.get('app.js')}"></script>
      </head>
      <noscript>
        <div class="noscript">
          <h2>${state.translate('javascriptRequired')}</h2>
          <p>
            <a
              class="link"
              href="https://github.com/mozilla/send/blob/master/docs/faq.md#why-does-firefox-send-require-javascript"
            >
              ${state.translate('whyJavascript')}
            </a>
          </p>
          <p>${state.translate('enableJavascript')}</p>
        </div>
      </noscript>
      ${body} ${initScript(state)}
    </html>
  `;
};
