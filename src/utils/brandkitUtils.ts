import { IBrand, IBrandTextStyle } from '@/interfaces/brandkit'
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
      logos: [],
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
