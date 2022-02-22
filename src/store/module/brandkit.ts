import { GetterTree, ActionTree, MutationTree } from 'vuex'
import { IBrand, IBrandColorPalette, IBrandLogo } from '@/interfaces/brandkit'
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
    commit('SET_currentBrand', brands[0])
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
  },
  async removeLogo({ commit }, logo: IBrandLogo) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    brandkitApi.updateBrandsWrapper({}, () => {
      commit('UPDATE_deleteLogo', logo)
    }, () => {
      commit('UPDATE_addLogo', logo)
    }, () => {
      showNetworkError()
    })
  },
  async removePalette({ commit }, palette: IBrandColorPalette) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    brandkitApi.updateBrandsWrapper({}, () => {
      commit('UPDATE_deletePalette', palette)
    }, () => {
      commit('UPDATE_addPalette', palette)
    }, () => {
      showNetworkError()
    })
  },
  async createPalette({ commit }) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const palette = brandkitUtils.createDefaultPalette()
    brandkitApi.updateBrandsWrapper({}, () => {
      commit('UPDATE_addPalette', palette)
    }, () => {
      commit('UPDATE_deletePalette', palette)
    }, () => {
      showNetworkError()
    })
    return palette.id
  },
  async removeColor({ state, commit }, updateInfo: { id: string, index: number }) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const color = brandkitUtils.getColor(currentBrand, updateInfo)
    brandkitApi.updateBrandsWrapper({}, () => {
      commit('UPDATE_deleteColor', updateInfo)
    }, () => {
      commit('UPDATE_addColor', { ...updateInfo, color })
    }, () => {
      showNetworkError()
    })
  },
  async createColor({ state, commit }, paletteId: string) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    brandkitApi.updateBrandsWrapper({}, () => {
      commit('UPDATE_addColor', { id: paletteId, index: -1, color: brandkitUtils.createDefaultColor() })
    }, () => {
      commit('UPDATE_deleteColor', { id: paletteId, index: -1 })
    }, () => {
      showNetworkError()
    })
  },
  async updateColor({ state, commit }, updateInfo: { id: string, index: number, color: string }) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const oldColor = brandkitUtils.getColor(currentBrand, updateInfo)
    brandkitApi.updateBrandsWrapper({}, () => {
      commit('UPDATE_setColor', updateInfo)
    }, () => {
      commit('UPDATE_setColor', { ...updateInfo, color: oldColor })
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
    if (index < 0) return
    state.brands.splice(index, 1)
    if (state.currentBrandId === brand.id) {
      state.currentBrandId = state.brands[0].id
    }
  },
  UPDATE_addLogo(state: IBrandKitState, logo: IBrandLogo) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    currentBrand.logos.push(logo)
  },
  UPDATE_deleteLogo(state: IBrandKitState, logo: IBrandLogo) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const index = currentBrand.logos.findIndex(logo_ => logo_.id === logo.id)
    if (index < 0) return
    currentBrand.logos.splice(index, 1)
  },
  UPDATE_addPalette(state: IBrandKitState, palette: IBrandColorPalette) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    currentBrand.colorPalettes.push(palette)
  },
  UPDATE_deletePalette(state: IBrandKitState, palette: IBrandColorPalette) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const index = currentBrand.colorPalettes.findIndex(palette_ => palette_.id === palette.id)
    if (index < 0) return
    currentBrand.colorPalettes.splice(index, 1)
  },
  UPDATE_addColor(state: IBrandKitState, updateInfo: { id: string, index: number, color: string }) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const colorPalette = currentBrand.colorPalettes.find(palette => palette.id === updateInfo.id)
    if (!colorPalette) return
    if (updateInfo.index === -1) {
      colorPalette.colors.push(updateInfo.color)
    } else {
      colorPalette.colors.splice(updateInfo.index, 0, updateInfo.color)
    }
  },
  UPDATE_deleteColor(state: IBrandKitState, updateInfo: { id: string, index: number }) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const colorPalette = currentBrand.colorPalettes.find(palette => palette.id === updateInfo.id)
    if (!colorPalette) return
    if (updateInfo.index === -1) {
      colorPalette.colors.pop()
    } else {
      colorPalette.colors.splice(updateInfo.index, 1)
    }
  },
  UPDATE_setColor(state: IBrandKitState, updateInfo: { id: string, index: number, color: string }) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const colorPalette = currentBrand.colorPalettes.find(palette => palette.id === updateInfo.id)
    if (!colorPalette) return
    colorPalette.colors.splice(updateInfo.index, 1, updateInfo.color)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
