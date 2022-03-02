import { GetterTree, ActionTree, MutationTree } from 'vuex'
import { IBrand, IBrandColor, IBrandColorPalette, IBrandFont, IBrandLogo, IBrandTextStyle } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'
import brandkitApi from '@/apis/brandkit'
import Vue from 'vue'
import i18n from '@/i18n'
import generalUtils from '@/utils/generalUtils'

interface IBrandKitState {
  brands: IBrand[],
  currentBrandId: string,
  isBrandsLoading: boolean,
  selectedTab: string
}

const DEFAULT_BRAND = brandkitUtils.createDefaultBrand()
const showNetworkError = () => {
  Vue.notify({ group: 'error', text: `${i18n.t('NN0242')}` })
}

const getDefaultState = (): IBrandKitState => ({
  brands: [],
  currentBrandId: '',
  isBrandsLoading: false,
  selectedTab: brandkitUtils.getTabKeys()[0]
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
  },
  getSelectedTab(state: IBrandKitState): string {
    return state.selectedTab
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
  async copyBrand({ commit }, brand: IBrand) {
    const newBrand = generalUtils.deepCopy(brand)
    newBrand.id = generalUtils.generateAssetId()
    brandkitApi.updateBrandsWrapper({}, () => {
      commit('UPDATE_addBrand', newBrand)
      commit('SET_currentBrand', newBrand)
    }, () => {
      commit('UPDATE_deleteBrand', newBrand)
    }, () => {
      showNetworkError()
    })
  },
  async removeBrand({ commit }, brand: IBrand) {
    brandkitApi.updateBrandsWrapper({}, () => {
      commit('UPDATE_deleteBrand', brand)
    }, () => {
      commit('UPDATE_addBrand', brand)
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
  async setPaletteName({ commit }, updateInfo: { palette: IBrandColorPalette, newName: string }) {
    const { palette, newName } = updateInfo
    const oldName = palette.name
    brandkitApi.updateBrandsWrapper({}, () => {
      palette.name = newName
    }, () => {
      palette.name = oldName
    }, () => {
      showNetworkError()
    })
  },
  async removeColor({ state, commit }, updateInfo: { paletteId: string, color: IBrandColor }) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    brandkitApi.updateBrandsWrapper({}, () => {
      commit('UPDATE_deleteColor', updateInfo)
    }, () => {
      commit('UPDATE_addColor', updateInfo)
    }, () => {
      showNetworkError()
    })
  },
  async createColor({ state, commit }, paletteId: string) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const palette = brandkitUtils.getColorPalette(currentBrand.colorPalettes, paletteId)
    if (!palette) return
    const newColor = brandkitUtils.duplicateEnd(palette.colors)
    brandkitApi.updateBrandsWrapper({}, () => {
      commit('UPDATE_addColor', { paletteId, color: newColor })
    }, () => {
      commit('UPDATE_deleteColor', { paletteId, color: newColor })
    }, () => {
      showNetworkError()
    })
  },
  async updateColor({ state, commit }, updateInfo: { paletteId: string, id: string, color: string }) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const oldColor = brandkitUtils.getColor(currentBrand, updateInfo)
    if (!oldColor) return
    const oldColorHex = oldColor.color
    brandkitApi.updateBrandsWrapper({}, () => {
      commit('UPDATE_setColor', updateInfo)
    }, () => {
      commit('UPDATE_setColor', { ...updateInfo, color: oldColorHex })
    }, () => {
      showNetworkError()
    })
  },
  async removeFont({ state, commit }, font: IBrandFont) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    brandkitApi.updateBrandsWrapper({}, () => {
      commit('UPDATE_deleteFont', font)
    }, () => {
      commit('UPDATE_addFont', font)
    }, () => {
      showNetworkError()
    })
  },
  async updateTextStyle({ state, commit }, updateInfo: { type: string, style: Partial<IBrandTextStyle> }) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const isDefaultBeforeUpdate = brandkitUtils.getTextIsDefault(currentBrand, updateInfo.type)
    brandkitApi.updateBrandsWrapper({}, () => {
      commit('UPDATE_updateTextStyle', updateInfo)
      if (isDefaultBeforeUpdate) {
        commit('UPDATE_updateTextStyle', { type: updateInfo.type, style: { isDefault: false } })
      }
    }, () => {
      commit('UPDATE_updateTextStyle', { type: updateInfo.type, style: brandkitUtils.getCurrentValues(currentBrand, updateInfo) })
      if (isDefaultBeforeUpdate) {
        commit('UPDATE_updateTextStyle', { type: updateInfo.type, style: { isDefault: true } })
      }
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
  SET_selectedTab(state: IBrandKitState, selectedTab: string) {
    state.selectedTab = selectedTab
  },
  UPDATE_addBrand(state: IBrandKitState, brand: IBrand) {
    const index = brandkitUtils.findInsertIndex(state.brands, brand, true)
    state.brands.splice(index, 0, brand)
  },
  UPDATE_deleteBrand(state: IBrandKitState, brand: IBrand) {
    const index = state.brands.findIndex(brand_ => brand_.id === brand.id)
    if (index < 0) return
    state.brands.splice(index, 1)
    if (state.brands.length === 0) {
      state.brands = [brandkitUtils.createDefaultBrand()]
    }
    if (state.currentBrandId === brand.id) {
      state.currentBrandId = state.brands[0].id
    }
  },
  UPDATE_addLogo(state: IBrandKitState, logo: IBrandLogo) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const index = brandkitUtils.findInsertIndex(currentBrand.logos, logo)
    currentBrand.logos.splice(index, 0, logo)
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
    const index = brandkitUtils.findInsertIndex(currentBrand.colorPalettes, palette)
    currentBrand.colorPalettes.splice(index, 0, palette)
  },
  UPDATE_deletePalette(state: IBrandKitState, palette: IBrandColorPalette) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const index = currentBrand.colorPalettes.findIndex(palette_ => palette_.id === palette.id)
    if (index < 0) return
    currentBrand.colorPalettes.splice(index, 1)
  },
  UPDATE_addColor(state: IBrandKitState, updateInfo: { paletteId: string, color: IBrandColor }) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const colorPalette = currentBrand.colorPalettes.find(palette => palette.id === updateInfo.paletteId)
    if (!colorPalette) return
    const index = brandkitUtils.findInsertIndex(colorPalette.colors, updateInfo.color, true)
    colorPalette.colors.splice(index, 0, updateInfo.color)
  },
  UPDATE_deleteColor(state: IBrandKitState, updateInfo: { paletteId: string, color: IBrandColor }) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const colorPalette = currentBrand.colorPalettes.find(palette => palette.id === updateInfo.paletteId)
    if (!colorPalette) return
    const index = colorPalette.colors.findIndex(color => color.id === updateInfo.color.id)
    if (index < 0) return
    colorPalette.colors.splice(index, 1)
  },
  UPDATE_setColor(state: IBrandKitState, updateInfo: { paletteId: string, id: string, color: string }) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const colorPalette = currentBrand.colorPalettes.find(palette => palette.id === updateInfo.paletteId)
    if (!colorPalette) return
    const index = colorPalette.colors.findIndex(color => color.id === updateInfo.id)
    if (index < 0) return
    const oldColor = colorPalette.colors[index]
    colorPalette.colors.splice(index, 1, { ...oldColor, color: updateInfo.color })
  },
  UPDATE_deleteFont(state: IBrandKitState, font: IBrandFont) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const index = currentBrand.fonts.findIndex(font_ => font_.id === font.id)
    if (index < 0) return
    currentBrand.fonts.splice(index, 1)
  },
  UPDATE_addFont(state: IBrandKitState, font: IBrandFont) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const index = brandkitUtils.findInsertIndex(currentBrand.fonts, font)
    currentBrand.fonts.splice(index, 0, font)
  },
  UPDATE_updateTextStyle(state: IBrandKitState, updateInfo: { type: string, style: any }) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const textStyle = (currentBrand.textStyleSetting as any)[`${updateInfo.type}Style`]
    if (!textStyle) return
    for (const [key, value] of Object.entries(updateInfo.style)) {
      textStyle[key] = value
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
