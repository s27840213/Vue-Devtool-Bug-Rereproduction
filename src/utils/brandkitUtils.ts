import { IBrand, IBrandLogo, IBrandTextStyle } from '@/interfaces/brandkit'
import store from '@/store'
import generalUtils from './generalUtils'

const TAB_NAMES = {
  logo: 'NN0399',
  text: 'NN0400',
  color: 'NN0401'
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
      colorPalettes: [],
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

  fetchBrands(fetcher: () => Promise<void>, clear = true) {
    if (clear) {
      store.commit('brandkit/SET_brands', [])
    }
    store.commit('brandkit/SET_isBrandsLoading', true)
    fetcher().then(() => {
      store.commit('brandkit/SET_isBrandsLoading', false)
    })
  }
}

export default new BrandKitUtils()
