import i18n from '@/i18n'
import { IBrand, IBrandColor, IBrandColorPalette, IBrandFont, IBrandLogo, IBrandTextStyle } from '@/interfaces/brandkit'
import store from '@/store'
import generalUtils from './generalUtils'
import defaultHeading from '@/assets/json/heading.json'
import defaultSubheading from '@/assets/json/subheading.json'
import defaultBody from '@/assets/json/body.json'

const TAB_NAMES = {
  logo: 'NN0399',
  color: 'NN0401',
  text: 'NN0400'
}

const TEXT_DEFAULTS = {
  heading: {
    defaultHeading
  },
  subheading: {
    defaultSubheading
  },
  body: {
    defaultBody
  }
}

interface Item {
  createTime: string
}

class BrandKitUtils {
  createTestingDefaultBrand(): IBrand {
    const initTime = Date.now()
    return {
      id: generalUtils.generateAssetId(),
      createTime: (new Date(initTime)).toISOString(),
      name: '',
      logos: [{
        name: 'logo-horizontal.png',
        id: generalUtils.generateAssetId(),
        createTime: (new Date(initTime + 30)).toISOString(),
        url: require('@/assets/img/png/brandkit/logo-horizontal.png'),
        width: 171,
        height: 132
      }, {
        name: 'logo-square.png',
        id: generalUtils.generateAssetId(),
        createTime: (new Date(initTime + 20)).toISOString(),
        url: require('@/assets/img/png/brandkit/logo-square.png'),
        width: 131,
        height: 131
      }, {
        name: 'logo-vertical.png',
        id: generalUtils.generateAssetId(),
        createTime: (new Date(initTime + 10)).toISOString(),
        url: require('@/assets/img/png/brandkit/logo-vertical.png'),
        width: 75,
        height: 171
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
      }],
      fonts: [{
        type: 'public',
        id: generalUtils.generateAssetId(),
        createTime: (new Date(initTime + 60)).toISOString(),
        name: 'Angkor',
        ver: 0,
        namePrevUrl: require('@/assets/img/png/brandkit/font1.png'),
        textPrevUrl: require('@/assets/img/png/brandkit/font1_prev.png')
      }, {
        type: 'public',
        id: generalUtils.generateAssetId(),
        createTime: (new Date(initTime + 50)).toISOString(),
        name: 'Arial Hebrew School',
        ver: 0,
        namePrevUrl: require('@/assets/img/png/brandkit/font2.png'),
        textPrevUrl: require('@/assets/img/png/brandkit/font2_prev.png')
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
      colorPalettes: [],
      fonts: []
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
      colorPalettes: [],
      fonts: []
    }
  }

  createDefaultTextStyle(type: string): IBrandTextStyle {
    const res = {
      font: {
        id: '',
        name: '',
        type: '',
        ver: 0,
        textPrevUrl: '',
        namePrevUrl: '',
        createTime: ''
      },
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

  getTabNames(): { [key: string]: string } {
    return TAB_NAMES
  }

  getTabKeys(): string[] {
    return Object.keys(TAB_NAMES)
  }

  setBrandName(brand: IBrand, newName: string) {
    store.dispatch('brandkit/setBrandName', { brand, newName })
  }

  addNewBrand() {
    store.dispatch('brandkit/createBrand')
  }

  copyBrand(brand: IBrand) {
    store.dispatch('brandkit/copyBrand', brand)
  }

  removeBrand(brand: IBrand) {
    store.dispatch('brandkit/removeBrand', brand)
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

  async updateTextStyle(type: string, style: Partial<IBrandTextStyle>) {
    await store.dispatch('brandkit/updateTextStyle', { type, style })
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

  duplicateEnd(colors: IBrandColor[]): IBrandColor {
    return {
      ...(colors[colors.length - 1] ?? this.createDefaultColor()),
      id: generalUtils.generateAssetId(),
      createTime: (new Date()).toISOString()
    }
  }

  getCurrentValues(brand: any, info: { type: string, style: Partial<IBrandTextStyle> }): {[key: string]: any} {
    const textStyle = (brand.textStyleSetting)[`${info.type}Style`] as any
    if (!textStyle) return {}
    const res = {} as {[key: string]: any}
    for (const k of Object.keys(info.style)) {
      res[k] = textStyle[k]
    }
    res.isDefault = textStyle.isDefault
    return res
  }

  // getTextIsDefault(brand: any, type: string): boolean {
  //   const textStyle = (brand.textStyleSetting)[`${type}Style`] as any
  //   if (!textStyle) return false
  //   return textStyle.isDefault
  // }

  getUpdateStyleAPIEncoding(style: Partial<IBrandTextStyle>): string {
    const pairs = Object.entries(style).map(([key, value]) => {
      return `${key}@${value}`
    })
    pairs.push('isDefault@false')
    return pairs.join(',')
  }

  composeSettingText(textStyle: IBrandTextStyle, type: string): string {
    return `${type},${textStyle.font.name},${textStyle.size}`
  }

  getDownloadUrl(logo: IBrandLogo): string {
    return logo.url
  }

  getDisplayedBrandName(brand: IBrand): string {
    return (!this.checkIsNullBrand(brand) && brand.name === '') ? `${i18n.t('NN0397')}` : brand.name
  }

  getDisplayedPaletteName(colorPalette: IBrandColorPalette): string {
    return colorPalette.name === '' ? `${i18n.t('NN0405')}` : colorPalette.name
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
}

export default new BrandKitUtils()
