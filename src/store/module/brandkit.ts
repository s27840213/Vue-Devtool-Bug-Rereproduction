import { GetterTree, ActionTree, MutationTree } from 'vuex'
import { IBrand } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'
import brandkitApi from '@/apis/brandkit'
import Vue from 'vue'
import i18n from '@/i18n'

interface IBrandKitState {
  brands: IBrand[],
  currentBrandId: string,
  isBrandsLoading: boolean
}

const DEFAULT_BRAND = brandkitUtils.createDefaultBrand()
const showNetworkError = () => {
  Vue.notify({ group: 'error', text: `${i18n.t('NN0242')}` })
}

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
  },
  async setBrandName({ commit }, updateInfo: { brand: IBrand, newName: string }) {
    const { brand, newName } = updateInfo
    const oldName = brand.name
    brandkitApi.updateBrandsWrapper({}, () => {
      brand.name = newName
    }, () => {
      brand.name = oldName
    }, () => {
      showNetworkError()
    })
  },
  async createBrand({ commit }) {
    const brand = brandkitUtils.createDefaultBrand()
    brandkitApi.updateBrandsWrapper({}, () => {
      commit('UPDATE_addBrand', brand)
      commit('SET_currentBrand', brand)
    }, () => {
      commit('UPDATE_deleteBrand', brand)
    }, () => {
      showNetworkError()
    })
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
  UPDATE_addBrand(state: IBrandKitState, brand: IBrand) {
    state.brands.push(brand)
  },
  UPDATE_deleteBrand(state: IBrandKitState, brand: IBrand) {
    const index = state.brands.findIndex(brand_ => brand_.id === brand.id)
    if (index >= 0) {
      state.brands.splice(index, 1)
      if (state.currentBrandId === brand.id) {
        state.currentBrandId = state.brands[0].id
      }
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
