import jp_shaked_cm from '@/locales/charmix/jp_shaked.json'
import pt_shaked_cm from '@/locales/charmix/pt_shaked.json'
import tw_shaked_cm from '@/locales/charmix/tw_shaked.json'
import us_shaked_cm from '@/locales/charmix/us_shaked.json'
import jp from '@/locales/jp.json'
import pt from '@/locales/pt.json'
import jp_shaked_stk from '@/locales/stk/jp_shaked.json'
import pt_shaked_stk from '@/locales/stk/pt_shaked.json'
import tw_shaked_stk from '@/locales/stk/tw_shaked.json'
import us_shaked_stk from '@/locales/stk/us_shaked.json'
import tw from '@/locales/tw.json'
import us from '@/locales/us.json'
import jp_shaked_pic from '@/locales/vivipic/jp_shaked.json'
import pt_shaked_pic from '@/locales/vivipic/pt_shaked.json'
import tw_shaked_pic from '@/locales/vivipic/tw_shaked.json'
import us_shaked_pic from '@/locales/vivipic/us_shaked.json'
import { createI18n } from 'vue-i18n'

export type LocaleName = 'us' | 'tw' | 'jp' | 'pt'

const isDev = process.env.NODE_ENV !== 'production'

const us_shaked = process.env.VUE_APP_APP_NAME === 'stk' ? us_shaked_stk
  : (process.env.VUE_APP_APP_NAME === 'pic' ? us_shaked_pic
    : us_shaked_cm)

const tw_shaked = process.env.VUE_APP_APP_NAME === 'stk' ? tw_shaked_stk
  : (process.env.VUE_APP_APP_NAME === 'pic' ? tw_shaked_pic
    : tw_shaked_cm)

const jp_shaked = process.env.VUE_APP_APP_NAME === 'stk' ? jp_shaked_stk
  : (process.env.VUE_APP_APP_NAME === 'pic' ? jp_shaked_pic
    : jp_shaked_cm)

const pt_shaked = process.env.VUE_APP_APP_NAME === 'stk' ? pt_shaked_stk
  : (process.env.VUE_APP_APP_NAME === 'pic' ? pt_shaked_pic
    : pt_shaked_cm)

const i18n = createI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'us',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'us',
  messages: {
    us: isDev ? us : us_shaked,
    tw: isDev ? tw : tw_shaked,
    jp: isDev ? jp : jp_shaked,
    ...(process.env.VUE_APP_APP_NAME === 'stk' ? {
      pt: isDev ? pt : pt_shaked,
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
