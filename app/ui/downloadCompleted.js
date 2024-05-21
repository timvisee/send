const html = require('choo/html');
const assets = require('../../common/assets');

module.exports = function(state) {
  const WEB_UI = state.WEB_UI;
  const btnText = state.user.loggedIn ? 'okButton' : 'sendYourFilesLink';
  return html`
    <div
      id="download-complete"
      class="flex flex-col items-center justify-center h-full w-full bg-white p-2 dark:bg-grey-90"
    >
      <h1 class="text-center text-3xl font-bold my-2">
        ${state.translate('downloadFinish')}
      </h1>
      <svg class="my-8 h-48 text-primary">
        <use xlink:href="${assets.get('completed.svg')}#Page-1" />
      </svg>
      <p
        class="text-grey-80 leading-normal dark:text-grey-40 ${state.user
          .loggedIn
          ? 'hidden'
          : ''}"
      >
        ${state.translate('trySendDescription')}
      </p>
      <p class="my-5">
        <a href="${WEB_UI.TRY_SEND_URL}" class="btn rounded-lg flex items-center mt-4" role="button"
          >${state.translate(btnText)}</a
        >
      </p>
    </div>
  `;
};
