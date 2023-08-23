import tw from '@/locales/tw.json'
import us from '@/locales/us.json'
import { createI18n } from 'vue-i18n'

export default createI18n({
  legacy: false,
  locale: 'us',
  fallbackLocale: 'us',
  messages: {
    us: us,
    zh: tw
  },
  globalInjection: true
})
