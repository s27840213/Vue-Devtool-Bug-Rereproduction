import en from '@/locales/en.json'
import tw from '@/locales/tw.json'
import { createI18n } from 'vue-i18n'

export default createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: en,
    zh: tw
  },
  globalInjection: true
})
