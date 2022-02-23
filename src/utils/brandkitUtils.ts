import { IBrand, IBrandColorPalette, IBrandLogo, IBrandTextStyle } from '@/interfaces/brandkit'
import store from '@/store'
import generalUtils from './generalUtils'

const TAB_NAMES = {
  logo: 'NN0399',
  color: 'NN0401',
  text: 'NN0400'
}

class BrandKitUtils {
  createDefaultBrand(): IBrand {
    return {
      id: generalUtils.generateAssetId(),
      name: '',
      logos: [{
        name: 'logo-horizontal.png',
        id: generalUtils.generateAssetId(),
        url: require('@/assets/img/png/brandkit/logo-horizontal.png'),
        width: 171,
        height: 132
      }, {
        name: 'logo-square.png',
        id: generalUtils.generateAssetId(),
        url: require('@/assets/img/png/brandkit/logo-square.png'),
        width: 131,
        height: 131
      }, {
        name: 'logo-vertical.png',
        id: generalUtils.generateAssetId(),
        url: require('@/assets/img/png/brandkit/logo-vertical.png'),
        width: 75,
        height: 171
      }],
      textStyleSetting: {
        headingStyle: this.createDefaultTextStyle(),
        subheadingStyle: this.createDefaultTextStyle(),
        bodyStyle: this.createDefaultTextStyle()
      },
      colorPalettes: [{
        id: generalUtils.generateAssetId(),
        name: '',
        colors: [
          '#3C64B1', '#276AEA', '#19C84A', '#FE7565', '#FECD56',
          '#FFCECE', '#C9DBFF', '#6B798B', '#50A2D8', '#409CB5',
          '#00A0E9', '#40A95E', '#969BAB', '#C3CBCD', '#C3CBCD',
          '#FFFFFF', '#4469A0', '#1877F2', '#FF9900', '#43EEED',
          '#68B82B'
        ]
      }, {
        id: generalUtils.generateAssetId(),
        name: '',
        colors: [
          '#3C64B1', '#276AEA', '#19C84A', '#FE7565', '#FECD56',
          '#FFCECE', '#C9DBFF', '#6B798B', '#50A2D8', '#409CB5',
          '#00A0E9', '#40A95E', '#969BAB', '#C3CBCD', '#C3CBCD',
          '#FFFFFF', '#4469A0', '#1877F2', '#FF9900', '#43EEED',
          '#68B82B', '#F84343', '#EA273E', '#55400C'
        ]
      }],
      fonts: []
    }
  }

  createDefaultTextStyle(): IBrandTextStyle {
    return {
      font: '',
      size: -1,
      isDefault: true
    }
  }

  createDefaultPalette(): IBrandColorPalette {
    return {
      id: generalUtils.generateAssetId(),
      name: '',
      colors: [this.createDefaultColor()]
    }
  }

  createDefaultColor(): string {
    return '#4EABE6'
  }

  getTabNames(): { [key: string]: string } {
    return TAB_NAMES
  }

  getTabKeys(): string[] {
    return Object.keys(TAB_NAMES)
  }

  findBrand(brands: IBrand[], id: string): IBrand | undefined {
    return brands.find(brand => brand.id === id)
  }

  setBrandName(brand: IBrand, newName: string) {
    store.dispatch('brandkit/setBrandName', { brand, newName })
  }

  addNewBrand() {
    store.dispatch('brandkit/createBrand')
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

  removeColor(paletteId: string, index: number) {
    store.dispatch('brandkit/removeColor', { id: paletteId, index })
  }

  updateColor(paletteId: string, index: number, color: string) {
    store.dispatch('brandkit/updateColor', { id: paletteId, index, color })
  }

  createColor(paletteId: string) {
    store.dispatch('brandkit/createColor', paletteId)
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

  getColor(brand: IBrand, info: { id: string, index: number }): string {
    const colorPalette = brand.colorPalettes.find(palette => palette.id === info.id)
    if (!colorPalette) return '#FFFFFF'
    return colorPalette.colors[info.index]
  }

  getColorPalette(colorPalettes: IBrandColorPalette[], paletteId: string): IBrandColorPalette | undefined {
    return colorPalettes.find(palette => palette.id === paletteId)
  }
}

export default new BrandKitUtils()
