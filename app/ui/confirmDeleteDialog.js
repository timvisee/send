const html = require('choo/html');

module.exports = function(archive) {
  return function(state, emit, close) {
    return html`
      <send-ok-dialog class="flex flex-col max-w-sm p-4 m-auto">
        <h2 class="text-center text-xl font-bold m-8 leading-normal">
          ${state.translate('deleteConfirmation')}
        </h2>
        <div class="grid grid-cols-2 gap-4">
          <button
            class="border-2 border-primary cursor-pointer py-4 px-6 font-semibold rounded-lg w-full flex-shrink-0"
            onclick="${close}"
            title="${state.translate('cancelButton')}"
          >
            ${state.translate('cancelButton')}
          </button>
          <button
            class="btn rounded-lg w-full flex-shrink-0"
            onclick="${confirm}"
            title="${state.translate('continueButton')}"
          >
            ${state.translate('continueButton')}
          </button>
        </div>
      </send-ok-dialog>
    `;

    function confirm(event) {
      console.log(state);
      event.stopPropagation();
      emit('confirmedDelete', archive);
      close();
    }
  };
};
