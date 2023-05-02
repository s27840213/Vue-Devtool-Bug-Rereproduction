import i18n from '@/i18n'
import { IUserFontContentData, IUserLogoContentData } from '@/interfaces/api'
import { IBrand, IBrandColor, IBrandColorPalette, IBrandFont, IBrandLogo, IBrandTextStyle, IBrandTextStyleSetting, IDeletingItem } from '@/interfaces/brandkit'
import store from '@/store'
import { STANDARD_TEXT_FONT } from './assetUtils'
import generalUtils from './generalUtils'
import imageUtils from './imageUtils'

const TAB_NAMES = {
  logo: 'NN0399',
  color: 'NN0401',
  text: 'NN0400'
}

const SIDEBAR_TAB_NAMES = {
  logo: 'NN0493',
  color: 'NN0495',
  text: 'NN0494'
}

const FONT_DEFAULTS = {
  tw: '思源黑體-標準',
  us: 'Roboto-Regular',
  jp: '裝甲明朝'
} as { [key: string]: string }

interface Item {
  createTime: string
}

class BrandKitUtils {
  // to-delete
  get isBrandkitAvailable(): boolean {
    // return store.getters['user/isAdmin']
    // return true // for testing private assets
    return !generalUtils.isTouchDevice()
  }

  createTestingDefaultBrand(): IBrand {
    const initTime = Date.now()
    return {
      id: generalUtils.generateAssetId(),
      createTime: (new Date(initTime)).toISOString(),
      name: '',
      logos: [{
        team_id: '',
        name: 'logo-horizontal.png',
        id: generalUtils.generateAssetId(),
        createTime: (new Date(initTime + 30)).toISOString(),
        signed_url: {
          full: require('@/assets/img/png/brandkit/logo-horizontal.png'),
          larg: require('@/assets/img/png/brandkit/logo-horizontal.png'),
          midd: require('@/assets/img/png/brandkit/logo-horizontal.png'),
          original: require('@/assets/img/png/brandkit/logo-horizontal.png'),
          prev: require('@/assets/img/png/brandkit/logo-horizontal.png'),
          smal: require('@/assets/img/png/brandkit/logo-horizontal.png'),
          tiny: require('@/assets/img/png/brandkit/logo-horizontal.png')
        },
        asset_index: 0,
        width: 171,
        height: 132,
        ver: 0
      }, {
        team_id: '',
        name: 'logo-square.png',
        id: generalUtils.generateAssetId(),
        createTime: (new Date(initTime + 20)).toISOString(),
        signed_url: {
          full: require('@/assets/img/png/brandkit/logo-square.png'),
          larg: require('@/assets/img/png/brandkit/logo-square.png'),
          midd: require('@/assets/img/png/brandkit/logo-square.png'),
          original: require('@/assets/img/png/brandkit/logo-square.png'),
          prev: require('@/assets/img/png/brandkit/logo-square.png'),
          smal: require('@/assets/img/png/brandkit/logo-square.png'),
          tiny: require('@/assets/img/png/brandkit/logo-square.png')
        },
        asset_index: 1,
        width: 131,
        height: 131,
        ver: 0
      }, {
        team_id: '',
        name: 'logo-vertical.png',
        id: generalUtils.generateAssetId(),
        createTime: (new Date(initTime + 10)).toISOString(),
        signed_url: {
          full: require('@/assets/img/png/brandkit/logo-vertical.png'),
          larg: require('@/assets/img/png/brandkit/logo-vertical.png'),
          midd: require('@/assets/img/png/brandkit/logo-vertical.png'),
          original: require('@/assets/img/png/brandkit/logo-vertical.png'),
          prev: require('@/assets/img/png/brandkit/logo-vertical.png'),
          smal: require('@/assets/img/png/brandkit/logo-vertical.png'),
          tiny: require('@/assets/img/png/brandkit/logo-vertical.png')
        },
        asset_index: 2,
        width: 75,
        height: 171,
        ver: 0
      }],
      textStyleSetting: {
        headingStyle: this.createDefaultTextStyle('heading'),
        subheadingStyle: this.createDefaultTextStyle('subheading'),
        bodyStyle: this.createDefaultTextStyle('body')
      },
      colorPalettes: [{
        id: generalUtils.generateAssetId(),
        createTime: (new Date(initTime + 50)).toISOString(),
        name: '',
        colors: this.generateBrandColors([
          '#3C64B1', '#276AEA', '#19C84A', '#FE7565', '#FECD56',
          '#FFCECE', '#C9DBFF', '#6B798B', '#50A2D8', '#409CB5',
          '#00A0E9', '#40A95E', '#969BAB', '#C3CBCD', '#C3CBCD',
          '#FFFFFF', '#4469A0', '#1877F2', '#FF9900', '#43EEED',
          '#68B82B'
        ])
      }, {
        id: generalUtils.generateAssetId(),
        createTime: (new Date(initTime + 40)).toISOString(),
        name: '',
        colors: this.generateBrandColors([
          '#3C64B1', '#276AEA', '#19C84A', '#FE7565', '#FECD56',
          '#FFCECE', '#C9DBFF', '#6B798B', '#50A2D8', '#409CB5',
          '#00A0E9', '#40A95E', '#969BAB', '#C3CBCD', '#C3CBCD',
          '#FFFFFF', '#4469A0', '#1877F2', '#FF9900', '#43EEED',
          '#68B82B', '#F84343', '#EA273E', '#55400C'
        ])
      }]
    }
  }

  createDefaultBrand(): IBrand {
    return {
      id: generalUtils.generateAssetId(),
      createTime: (new Date()).toISOString(),
      name: '',
      logos: [],
      textStyleSetting: {
        headingStyle: this.createDefaultTextStyle('heading'),
        subheadingStyle: this.createDefaultTextStyle('subheading'),
        bodyStyle: this.createDefaultTextStyle('body')
      },
      colorPalettes: []
    }
  }

  createNullBrand(): IBrand {
    return {
      id: 'null',
      createTime: '',
      name: '',
      logos: [],
      textStyleSetting: {
        headingStyle: this.createDefaultTextStyle('heading'),
        subheadingStyle: this.createDefaultTextStyle('subheading'),
        bodyStyle: this.createDefaultTextStyle('body')
      },
      colorPalettes: []
    }
  }

  createDefaultTextStyle(type: string): IBrandTextStyle {
    const res = {
      fontId: '',
      fontUserId: '',
      fontAssetId: '',
      fontType: '',
      fontName: '',
      bold: false,
      underline: false,
      italic: false,
      size: -1,
      isDefault: true
    }
    switch (type) {
      case 'heading':
        res.size = 60
        break
      case 'subheading':
        res.size = 34
        break
      case 'body':
        res.size = 24
        break
    }
    return res
  }

  createDefaultPalette(): IBrandColorPalette {
    return {
      id: generalUtils.generateAssetId(),
      createTime: (new Date()).toISOString(),
      name: '',
      colors: [this.createDefaultColor()]
    }
  }

  createDefaultColor(): IBrandColor {
    return {
      id: generalUtils.generateAssetId(),
      createTime: (new Date()).toISOString(),
      color: '#4EABE6'
    }
  }

  createDefaultFont(id: string): IBrandFont {
    return {
      asset_index: -1,
      author: '',
      createTime: (new Date()).toISOString(),
      favorite: 0,
      file_ext: '',
      file_name: '',
      id: 'new_' + id,
      name: '',
      team_id: '',
      updateTime: '',
      ver: 0,
      font_family: ''
    }
  }

  createDefaultLogo(id: string): IBrandLogo {
    return {
      team_id: '',
      name: '',
      id: 'new_' + id,
      createTime: (new Date()).toISOString(),
      asset_index: -1,
      width: 24,
      height: 24,
      ver: 0
    }
  }

  checkIsNullBrand(brand: IBrand): boolean {
    return brand.id === 'null'
  }

  generateBrandColors(colorHexes: string[]): IBrandColor[] {
    const initTime = Date.now()
    return colorHexes.map((colorHex, index) => ({
      id: generalUtils.generateAssetId(),
      createTime: (new Date(initTime + 10 * index)).toISOString(),
      color: colorHex
    }))
  }

  getTabNames(theme: string): { [key: string]: string } {
    return theme.includes('editor') ? SIDEBAR_TAB_NAMES : TAB_NAMES
  }

  getTabKeys(): string[] {
    return Object.keys(TAB_NAMES)
  }

  setBrandName(brand: IBrand, newName: string) {
    store.dispatch('brandkit/setBrandName', { brand, newName })
  }

  addNewBrand(name?: string) {
    store.dispatch('brandkit/createBrand', name)
  }

  copyBrand(brand: IBrand) {
    store.dispatch('brandkit/copyBrand', brand)
  }

  removeBrand(brand: IBrand) {
    store.dispatch('brandkit/removeBrand', brand).then((needFetch) => {
      if (!needFetch) return
      this.fetchBrands(async () => {
        await store.dispatch('brandkit/fetchBrands')
      })
    })
  }

  removeLogo(logo: IBrandLogo) {
    store.dispatch('brandkit/removeLogo', logo)
  }

  removePalette(palette: IBrandColorPalette) {
    store.dispatch('brandkit/removePalette', palette)
  }

  async createPalette() {
    return await store.dispatch('brandkit/createPalette')
  }

  setPaletteName(palette: IBrandColorPalette, newName: string) {
    store.dispatch('brandkit/setPaletteName', { palette, newName })
  }

  removeColor(paletteId: string, color: IBrandColor) {
    store.dispatch('brandkit/removeColor', { paletteId, color })
  }

  async updateColor(id: string, color: string) {
    return await store.dispatch('brandkit/updateColor', { id, color })
  }

  updateColorTemp(paletteId: string, id: string, color: string) {
    store.dispatch('brandkit/updateColorTemp', { paletteId, id, color })
  }

  createColor(paletteId: string) {
    store.dispatch('brandkit/createColor', paletteId)
  }

  removeFont(font: IBrandFont) {
    store.dispatch('brandkit/removeFont', font)
  }

  deleteFont(id: string) {
    store.commit('brandkit/UPDATE_deleteFont', { id })
  }

  deleteLogo(brandId: string, id: string) {
    store.commit('brandkit/UPDATE_deleteLogo', { brand: { id: brandId }, logo: { id } })
  }

  replaceFont(id: string, apiFont: IUserFontContentData) {
    store.commit('brandkit/UPDATE_replaceFont', {
      id,
      font: this.apiFont2IBrandFont(apiFont)
    })
  }

  replaceLogo(id: string, apiLogo: IUserLogoContentData, brandId: string) {
    const logo = this.apiLogo2IBrandLogo(apiLogo)
    if (logo.width === undefined || logo.height === undefined) {
      const url = this.getLogoUrl(logo, brandId, 'tiny')
      imageUtils.getImageSize(url, 24, 24).then(size => {
        if (!size.exists) {
          this.deleteLogo(brandId, id)
        } else {
          logo.width = size.width
          logo.height = size.height
          store.commit('brandkit/UPDATE_replaceLogo', {
            id,
            logo,
            brandId
          })
        }
      })
    } else {
      store.commit('brandkit/UPDATE_replaceLogo', {
        id,
        logo,
        brandId
      })
    }
  }

  async updateTextStyle(type: string, style: Partial<IBrandTextStyle>) {
    await store.dispatch('brandkit/updateTextStyle', { type, style })
  }

  createTempFont(id: string) {
    const newFont = this.createDefaultFont(id)
    store.commit('brandkit/UPDATE_addFont', newFont)
    return newFont.id
  }

  createTempLogo(brandId: string, id: string) {
    const newLogo = this.createDefaultLogo(id)
    store.commit('brandkit/UPDATE_addLogo', { brand: { id: brandId }, logo: newLogo })
    return newLogo.id
  }

  fetchBrands(fetcher: () => Promise<void>, clear = true) {
    if (clear) {
      store.commit('brandkit/SET_brands', [])
    }
    store.commit('brandkit/SET_isBrandsLoading', true)
    fetcher().then(() => {
      store.commit('brandkit/SET_isBrandsLoading', false)
    })
  }

  fetchLogos(fetcher: () => Promise<void>, clear = true) {
    if (clear) {
      store.commit('brandkit/SET_logos', [])
    }
    store.commit('brandkit/SET_isLogosLoading', true)
    fetcher().then(() => {
      store.commit('brandkit/SET_isLogosLoading', false)
    })
  }

  fetchPalettes(fetcher: () => Promise<void>, clear = true) {
    if (clear) {
      store.commit('brandkit/SET_palettes', [])
    }
    store.commit('brandkit/SET_isPalettesLoading', true)
    fetcher().then(() => {
      store.commit('brandkit/SET_isPalettesLoading', false)
    })
  }

  fetchFonts(fetcher: () => Promise<void>, clear = true) {
    if (clear) {
      store.commit('brandkit/SET_fonts', [])
    }
    store.commit('brandkit/SET_isFontsLoading', true)
    fetcher().then(() => {
      store.commit('brandkit/SET_isFontsLoading', false)
    })
  }

  findInsertIndex<T extends Item>(items: T[], item: T, ascending = false): number {
    const index = items.findIndex(i => {
      return ascending !== (Date.parse(i.createTime) < Date.parse(item.createTime))
    })
    return index === -1 ? items.length : index
  }

  findBrand(brands: IBrand[], id: string): IBrand | undefined {
    return brands.find(brand => brand.id === id)
  }

  getColor(brand: IBrand, info: { paletteId: string, id: string }): IBrandColor | undefined {
    const colorPalette = brand.colorPalettes.find(palette => palette.id === info.paletteId)
    if (!colorPalette) return undefined
    return colorPalette.colors.find(color => color.id === info.id)
  }

  getColorPalette(colorPalettes: IBrandColorPalette[], paletteId: string): IBrandColorPalette | undefined {
    return colorPalettes.find(palette => palette.id === paletteId)
  }

  getFont(assetId: string): IBrandFont | undefined {
    return (store.getters['brandkit/getFonts'] as IBrandFont[]).find(font => font.id === assetId)
  }

  getFontUrlMap(assetId: string): { [key: string]: string } | undefined {
    return store.getters['brandkit/getFontUrlMap'](assetId)
  }

  async refreshFontAsset(assetId: string): Promise<{ [key: string]: string }> {
    return await store.dispatch('brandkit/refreshFontAsset', assetId)
  }

  getFontPrevUrlByFontFamily(fontFamily: string, type: string, userId: string, assetId: string, postfix: 'prev-name' | 'prev-sample', ver?: number): string {
    switch (type) {
      case 'public':
        return `https://template.vivipic.com/font/${fontFamily}/${postfix}?ver=${ver ?? generalUtils.generateRandomString(6)}`
      case 'admin':
        return `https://template.vivipic.com/admin/${userId}/asset/font/${assetId}/${postfix}?ver=${ver ?? generalUtils.generateRandomString(6)}`
      case 'private': {
        const urlMap = this.getFontUrlMap(assetId) as { [key: string]: string } | undefined
        const url = urlMap?.[postfix]
        return url ? `${url}&ver=${ver ?? generalUtils.generateRandomString(6)}` : ''
      }
      default:
        return ''
    }
  }

  getLogoByAssetIndex(assetIndex: number): IBrandLogo | undefined {
    return (store.getters['brandkit/getLogos'](store.getters['brandkit/getCurrentBrandId']) as IBrandLogo[])
      .find(logo => logo.asset_index === assetIndex)
  }

  duplicateEnd(colors: IBrandColor[]): IBrandColor {
    return {
      ...(colors[colors.length - 1] ?? this.createDefaultColor()),
      id: generalUtils.generateAssetId(),
      createTime: (new Date()).toISOString()
    }
  }

  getCurrentValues(brand: any, info: { type: string, style: Partial<IBrandTextStyle> }): { [key: string]: any } {
    const textStyle = (brand.textStyleSetting)[`${info.type}Style`] as any
    if (!textStyle) return {}
    const res = {} as { [key: string]: any }
    for (const k of Object.keys(info.style)) {
      res[k] = textStyle[k]
    }
    res.isDefault = textStyle.isDefault
    return res
  }

  setDefaultFontInfo(brand: any, info: { type: string, style: Partial<IBrandTextStyle> }) {
    const textStyle = (brand.textStyleSetting)[`${info.type}Style`] as IBrandTextStyle
    if (!textStyle) return
    if (textStyle.fontId === '' && !info.style.fontId) { // if current font is not set and updateInfo doesn't set font as well
      info.style.fontId = STANDARD_TEXT_FONT[`${i18n.global.locale}`]
      info.style.fontName = FONT_DEFAULTS[`${i18n.global.locale}`]
      info.style.fontType = 'public'
    }
  }

  extractFonts(textStyleSetting: IBrandTextStyleSetting): ReturnType<BrandKitUtils['extractFontsFromStyle']>[] {
    return [
      this.extractFontsFromStyle(textStyleSetting.headingStyle),
      this.extractFontsFromStyle(textStyleSetting.subheadingStyle),
      this.extractFontsFromStyle(textStyleSetting.bodyStyle)
    ]
  }

  extractFontsFromStyle(textStyle: IBrandTextStyle): { type: string, face: string, url: string, userId: string, assetId: string, ver: string } {
    return {
      type: textStyle.fontType,
      face: textStyle.fontId,
      url: '',
      userId: textStyle.fontUserId,
      assetId: textStyle.fontAssetId,
      ver: store.getters['user/getVerUni']
    }
  }

  getUpdateStyleAPIEncoding(style: Partial<IBrandTextStyle>): string {
    const pairs = Object.entries(style).map(([key, value]) => {
      return `${key}@${value}@`
    })
    pairs.push('isDefault@false@')
    return pairs.join(',')
  }

  composeSettingText(textStyle: IBrandTextStyle, type: string): string {
    return `${type},${textStyle.fontName},${textStyle.size}`
  }

  getDefaultFontId(locale: string): string {
    return STANDARD_TEXT_FONT[locale]
  }

  getDefaultFontName(locale: string): string {
    return FONT_DEFAULTS[locale]
  }

  getDefaultFontSize(type: string): number {
    return this.createDefaultTextStyle(type).size
  }

  getLogoUrl(logo: IBrandLogo, brandId: string, size: 'prev' | 'full' | 'larg' | 'midd' | 'smal' | 'tiny' | 'original'): string {
    return logo.signed_url ? logo.signed_url[size] : `https://template.vivipic.com/admin/${logo.team_id}/asset/logo/${brandId}/${logo.id}/${size}?origin=true&ver=${logo.ver}`
  }

  getDisplayedBrandName(brand: IBrand): string {
    return (!this.checkIsNullBrand(brand) && brand.name === '') ? `${i18n.global.t('NN0397')}` : brand.name
  }

  getDisplayedPaletteName(colorPalette: IBrandColorPalette): string {
    return colorPalette.name === '' ? `${i18n.global.t('NN0405')}` : colorPalette.name
  }

  getDisplayedName(type: string, content: any) {
    switch (type) {
      case 'brand':
        return this.getDisplayedBrandName(content as IBrand)
      case 'palette':
        return this.getDisplayedPaletteName(content as IBrandColorPalette)
      default:
        return content.name
    }
  }

  apiLogo2IBrandLogo(logo: IUserLogoContentData): IBrandLogo {
    const res = { ...logo } as any
    delete res.create_time
    delete res.asset_id
    return {
      ...res,
      id: logo.id ?? logo.asset_index.toString(),
      createTime: logo.create_time
    }
  }

  apiFont2IBrandFont(font: IUserFontContentData): IBrandFont {
    const res = { ...font } as any
    delete res.create_time
    delete res.update_time
    return {
      ...res,
      id: font.id ?? font.asset_index.toString(),
      createTime: font.create_time,
      updateTime: font.update_time
    }
  }

  setMobileDeleteItemFromPhoto(assetIndex: number) {
    const logo = this.getLogoByAssetIndex(assetIndex)
    if (!logo) return console.log(`logo with assetIndex: ${assetIndex} is not found`)
    this.setMobileDeleteItem({
      type: 'logo',
      content: logo
    })
  }

  setMobileDeleteItem(item: IDeletingItem) {
    store.commit('brandkit/SET_mobileDeleteBuffer', item)
    store.commit('brandkit/SET_isMobileConfirmOpen', true)
  }
}

export default new BrandKitUtils()
