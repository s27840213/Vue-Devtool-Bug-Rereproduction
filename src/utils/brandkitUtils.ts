import { IBrand, IBrandTextStyle } from '@/interfaces/brandkit'
import store from '@/store'
import generalUtils from './generalUtils'

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

  findBrand(brands: IBrand[], id: string): IBrand | undefined {
    return brands.find(brand => brand.id === id)
  }

  setBrandName(brand: IBrand, newName: string) {
    store.dispatch('brandkit/setBrandName', { brand, newName })
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
