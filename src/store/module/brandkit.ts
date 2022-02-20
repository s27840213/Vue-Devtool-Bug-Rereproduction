import { GetterTree, ActionTree, MutationTree } from 'vuex'
import { IBrand } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'

interface IBrandKitState {
  brands: IBrand[],
  currentBrandId: string
}

const DEFAULT_BRANDS = [brandkitUtils.createDefaultBrand(), brandkitUtils.createDefaultBrand()]

const getDefaultState = (): IBrandKitState => ({
  brands: DEFAULT_BRANDS,
  currentBrandId: DEFAULT_BRANDS[0].id
})

const state = getDefaultState()
const getters: GetterTree<IBrandKitState, unknown> = {
  getBrands(state: IBrandKitState): IBrand[] {
    return state.brands
  },
  getCurrentBrand(state: IBrandKitState): IBrand {
    return brandkitUtils.findBrand(state.brands, state.currentBrandId) ?? state.brands[0]
  }
}

const actions: ActionTree<IBrandKitState, unknown> = {
}

const mutations: MutationTree<IBrandKitState> = {
  SET_brandName(state: IBrandKitState, updateInfo: { id: string, name: string}) {
    const brand = brandkitUtils.findBrand(state.brands, updateInfo.id)
    if (brand) {
      if (brandkitUtils.checkDefaultModified(brand) && state.currentBrandId === updateInfo.id) {
        state.currentBrandId = brand.id
      }
      brand.name = updateInfo.name
    }
  },
  SET_currentBrand(state: IBrandKitState, brand: IBrand) {
    state.currentBrandId = brand.id
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
