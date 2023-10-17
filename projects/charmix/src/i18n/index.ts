import tw from '@/i18n/full/tw.json'
import tw_shaked from '@/i18n/shaked/tw.json'
import us from '@/i18n/full/us.json'
import us_shaked from '@/i18n/shaked/us.json'
import { createI18n } from 'vue-i18n'

export default createI18n({
  legacy: false,
  locale: 'us',
  fallbackLocale: 'us',
  messages: {
    us: import.meta.env.PROD ? us_shaked : us,
    zh: import.meta.env.PROD ? tw_shaked : tw,
  },
  globalInjection: true,
})
