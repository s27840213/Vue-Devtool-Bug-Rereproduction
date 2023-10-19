import { createI18n } from 'vue-i18n'

export type LocaleName = 'us' | 'tw' | 'jp' | 'pt'

const i18n = createI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'us',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'us',
  messages: {} as Record<LocaleName, Record<string, string>>,
  globalInjection: true,
  legacy: true,
  postTranslation: (translated: string | unknown[] | unknown[]) => {
    if (typeof translated === 'string') {
      return translated
        .replace(/<blue>/g, '<span class="text-blue-1">')
        .replace(/<red>/g, '<span class="text-red">')
        .replace(/(<\/blue>|<\/red>)/g, '</span>')
        .replace(/<newline>/g, '<br/ > ')
    } else return translated
  },
  warnHtmlInMessage: 'off', // or use: 'warnHtmlMessage: false', https://github.com/intlify/vue-i18n-next/issues/853#issuecomment-1277631080
})

export default i18n
