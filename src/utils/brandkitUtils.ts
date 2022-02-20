import { IBrand, IBrandTextStyle } from '@/interfaces/brandkit'
import store from '@/store'
import generalUtils from './generalUtils'

class BrandKitUtils {
  createDefaultBrand(): IBrand {
    return {
      id: 'DEF_' + generalUtils.generateAssetId(),
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

  isDefaultBrand(brand: IBrand): boolean {
    return brand.id.startsWith('DEF_')
  }

  checkDefaultModified(brand: IBrand) {
    if (this.isDefaultBrand(brand)) {
      brand.id = brand.id.substring(4)
      return true
    }
    return false
  }

  findBrand(brands: IBrand[], id: string): IBrand | undefined {
    return brands.find(brand => brand.id === id)
  }

  setBrandName(id: string, name: string) {
    store.commit('brandkit/SET_brandName', { id, name })
  }
}

export default new BrandKitUtils()
