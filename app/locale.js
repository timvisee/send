import { FluentBundle, FluentResource } from '@fluent/bundle';

function makeBundle(locale, ftl) {
  const bundle = new FluentBundle(locale, { useIsolating: false });
  bundle.addResource(new FluentResource(ftl));
  return bundle;
}

export async function getTranslator(locale) {
  const bundles = [];
  const { default: en } = await import('../public/locales/en-US/send.ftl');
  try {
    if (locale !== 'en-US') {
      const { default: ftl } = await import(
        `../public/locales/${locale}/send.ftl`
      );
      bundles.push(makeBundle(locale, ftl));
    }
  } catch {
    console.warn(`Locale ${locale} not found. Using en-US as fallback.`);
  }
  bundles.push(makeBundle('en-US', en));
  return function(id, data) {
    for (let bundle of bundles) {
      if (bundle.hasMessage(id)) {
        return bundle.formatPattern(bundle.getMessage(id).value, data);
      }
    }
  };
}
