import tw from '@/locales/tw.json'
import tw_shaked from '@/locales/tw_shaked.json'
import us from '@/locales/us.json'
import us_shaked from '@/locales/us_shaked.json'
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
