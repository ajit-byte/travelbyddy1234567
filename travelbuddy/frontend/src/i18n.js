import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

// Translations are loaded from /public/locales/<lang>/translation.json
// Only the active language is fetched — no more bundling all languages upfront.

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'fr', 'de', 'jp'],
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
  });

export default i18n;
