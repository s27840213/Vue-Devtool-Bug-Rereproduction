import { GetterTree, ActionTree, MutationTree } from 'vuex'
import { IBrand } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'
import brandkitApi from '@/apis/brandkit'

interface IBrandKitState {
  brands: IBrand[],
  currentBrandId: string,
  isBrandsLoading: boolean
}

const DEFAULT_BRAND = brandkitUtils.createDefaultBrand()

const getDefaultState = (): IBrandKitState => ({
  brands: [],
  currentBrandId: '',
  isBrandsLoading: false
})

const state = getDefaultState()
const getters: GetterTree<IBrandKitState, unknown> = {
  getBrands(state: IBrandKitState): IBrand[] {
    return state.brands
  },
  getCurrentBrand(state: IBrandKitState): IBrand {
    return brandkitUtils.findBrand(state.brands, state.currentBrandId) ?? state.brands[0] ?? DEFAULT_BRAND
  },
  getIsBrandsLoading(state: IBrandKitState): boolean {
    return state.isBrandsLoading
  }
}

const actions: ActionTree<IBrandKitState, unknown> = {
  async fetchBrands({ commit }) {
    const brands = await brandkitApi.getTestingBrands(brandkitApi.getToken())
    commit('SET_brands', brands)
  }
}

const mutations: MutationTree<IBrandKitState> = {
  SET_brands(state: IBrandKitState, brands: IBrand[]) {
    state.brands = brands
  },
  SET_currentBrand(state: IBrandKitState, brand: IBrand) {
    state.currentBrandId = brand.id
  },
  SET_isBrandsLoading(state: IBrandKitState, isBrandsLoading: boolean) {
    state.isBrandsLoading = isBrandsLoading
  },
  SET_brandName(state: IBrandKitState, updateInfo: { id: string, name: string}) {
    const brand = brandkitUtils.findBrand(state.brands, updateInfo.id)
    if (brand) {
      if (brandkitUtils.checkDefaultModified(brand) && state.currentBrandId === updateInfo.id) {
        state.currentBrandId = brand.id
      }
      brand.name = updateInfo.name
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
