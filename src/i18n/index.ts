// import Vue from 'vue'
// import VueI18n, { LocaleMessages } from 'vue-i18n'

// Vue.use(VueI18n)

// function loadLocaleMessages(): LocaleMessages {
//   const locales = require.context('@/locales', true, /[A-Za-z0-9-_,\s]+\.json$/i)
//   const messages: LocaleMessages = {}
//   locales.keys().forEach(key => {
//     const matched = key.match(/([A-Za-z0-9-_]+)\./i)
//     if (matched && matched.length > 1) {
//       const locale = matched[1]
//       messages[locale] = locales(key)
//     }
//   })
//   return messages
// }

// export default new VueI18n({
//   locale: 'us',
//   fallbackLocale: 'us',
//   messages: loadLocaleMessages(),
//   postTranslation: (str: string): string => {
//     return str
//       .replace(/<blue>/g, '<span class="text-blue-1">')
//       .replace(/<\/blue>/g, '</span>')
//   }
// })

import VueI18n, { createI18n, LocaleMessages, VueMessageType } from 'vue-i18n'

/**
 * Load locale messages
 *
 * The loaded `JSON` locale messages is pre-compiled by `@intlify/vue-i18n-loader`, which is integrated into `vue-cli-plugin-i18n`.
 * See: https://github.com/intlify/vue-i18n-loader#rocket-i18n-resource-pre-compilation
 */
function loadLocaleMessages(): LocaleMessages<VueMessageType> {
  const locales = require.context('@/locales', true, /[A-Za-z0-9-_,\s]+\.json$/i)
  const messages: LocaleMessages<VueMessageType> = {}
  locales.keys().forEach(key => {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      const locale = matched[1]
      messages[locale] = locales(key).default
    }
  })
  return messages
}

const i18n = createI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'en',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  messages: loadLocaleMessages() as any,
  globalInjection: true,
  legacy: true
})

export default i18n
