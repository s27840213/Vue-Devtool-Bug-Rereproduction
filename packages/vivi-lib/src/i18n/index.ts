import jp from '@/locales/jp.json'
import jp_shaked from '@/locales/jp_shaked.json'
import pt from '@/locales/pt.json'
import pt_shaked from '@/locales/pt_shaked.json'
import tw from '@/locales/tw.json'
import tw_shaked from '@/locales/tw_shaked.json'
import us from '@/locales/us.json'
import us_shaked from '@/locales/us_shaked.json'
import generalUtils from '@/utils/generalUtils'
import { createI18n } from 'vue-i18n'

export type LocaleName = 'us' | 'tw' | 'jp' | 'pt'

const isProd = process.env.NODE_ENV === 'production'

const i18n = createI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'us',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'us',
  messages: {
    us: isProd ? us : us_shaked,
    tw: isProd ? tw : tw_shaked,
    jp: isProd ? jp : jp_shaked,
    ...(generalUtils.isStk ? {
      pt: isProd ? pt : pt_shaked,
    } : {})
  },
  globalInjection: true,
  legacy: true,
  postTranslation: (translated: unknown) => {
    if (typeof translated === 'string') {
      return translated
        .replace(/<blue>/g, '<span class="text-blue-1">')
        .replace(/<red>/g, '<span class="text-red">')
        .replace(/(<\/blue>|<\/red>)/g, '</span>')
        .replace(/<newline>/g, '<br/ > ')
    } else return translated
  },
})

export default i18n
