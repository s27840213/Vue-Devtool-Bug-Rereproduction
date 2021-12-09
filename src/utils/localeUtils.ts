import i18n from '@/i18n'
import { EventEmitter } from 'events'
interface ILocale {
  abbreviation: string,
  code: string,
  base: string,
  name: string
}

class LocaleUtils {
  SUPPORTED_LOCALES: Array<ILocale>
  localeMap: { [index: string]: string }
  defaultLocale: string
  constructor() {
    this.SUPPORTED_LOCALES = [{
      abbreviation: 'en',
      code: 'en',
      base: '/en',
      name: 'English'
    },
    {
      abbreviation: 'tw',
      code: 'tw',
      base: '',
      name: '繁體中文'
    },
    {
      abbreviation: 'jp',
      code: 'jp',
      base: '/jp',
      name: 'Français'
    }]

    this.localeMap = {
      tw: 'tw',
      en: 'en',
      jp: 'jp'
    }

    this.defaultLocale = 'tw'
  }

  isDefaultLocale(): boolean {
    return i18n.locale === this.defaultLocale
  }

  currLocale(): string {
    return i18n.locale
  }

  getLocaleRegex(): string {
    let reg = '|'
    this.SUPPORTED_LOCALES.forEach((locale, index) => {
      reg = `${reg}${locale.abbreviation}${index !== this.SUPPORTED_LOCALES.length - 1 ? '|' : ''}`
    })
    return `(${reg})`
  }

  getLocaleInfo(): ILocale {
    return this.SUPPORTED_LOCALES.find(loc => loc.code === i18n.locale) as ILocale
  }
}

export default new LocaleUtils()
