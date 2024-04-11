const html = require('choo/html');
const Header = require('./header');

module.exports = function body(main) {
  return function(state, emit) {
    const b = html`
      <body
        class="flex flex-col items-center font-sans md:h-screen md:bg-grey-10 dark:bg-black"
      >
        ${state.cache(Header, 'header').render()} ${main(state, emit)}
      </body>
    `;
    if (state.layout) {
      // server side only
      return state.layout(state, b);
    }
    return b;
  };
};
