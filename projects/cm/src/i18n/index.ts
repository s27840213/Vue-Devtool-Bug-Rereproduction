import tw from '@i18n/tw.json'
import us from '@i18n/us.json'
import { createI18n } from 'vue-i18n'

export default createI18n({
  legacy: false,
  locale: 'us',
  fallbackLocale: 'us',
  messages: {
    us,
    zh: tw,
  },
  globalInjection: true,
})
