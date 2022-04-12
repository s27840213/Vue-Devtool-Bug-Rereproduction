import store from '@/store'
import { GetterTree, ActionTree, MutationTree } from 'vuex'
import { IBrand, IBrandColor, IBrandColorPalette, IBrandFont, IBrandLogo, IBrandTextStyle } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'
import brandkitApi from '@/apis/brandkit'
import Vue from 'vue'
import i18n from '@/i18n'
import generalUtils from '@/utils/generalUtils'
import { IUserFontContentData } from '@/interfaces/api'
import { IGroup, IText } from '@/interfaces/layer'

interface IBrandKitState {
  brands: IBrand[],
  currentBrandId: string,
  isBrandsLoading: boolean,
  isFontsLoading: boolean,
  selectedTab: string,
  fonts: IBrandFont[],
  fetchedFonts: {[key: string]: {[key: string]: string}},
  fontsPageIndex: number
}

const NULL_BRAND = brandkitUtils.createNullBrand()
const showNetworkError = () => {
  Vue.notify({ group: 'error', text: `${i18n.t('NN0242')}` })
}

const getDefaultState = (): IBrandKitState => ({
  brands: [],
  currentBrandId: '',
  isBrandsLoading: false,
  isFontsLoading: false,
  selectedTab: brandkitUtils.getTabKeys()[0],
  fonts: [],
  fetchedFonts: {},
  fontsPageIndex: 0
})

const state = getDefaultState()
const getters: GetterTree<IBrandKitState, unknown> = {
  getBrands(state: IBrandKitState): IBrand[] {
    return state.brands
  },
  getCurrentBrand(state: IBrandKitState): IBrand {
    return brandkitUtils.findBrand(state.brands, state.currentBrandId) ?? state.brands[0] ?? NULL_BRAND
  },
  getIsBrandsLoading(state: IBrandKitState): boolean {
    return state.isBrandsLoading
  },
  getIsFontsLoading(state: IBrandKitState): boolean {
    return state.isFontsLoading
  },
  getSelectedTab(state: IBrandKitState): string {
    return state.selectedTab
  },
  getFonts(state: IBrandKitState): IBrandFont[] {
    return state.fonts
  },
  getFontsPageIndex(state: IBrandKitState): number {
    return state.fontsPageIndex
  },
  getFontUrlMap(state: IBrandKitState): (assetIndex: string) => {[key: string]: string} | undefined {
    return (assetIndex: string) => {
      const privateFont = state.fonts.find(font => font.signed_url && font.id === assetIndex)
      if (privateFont) return privateFont.signed_url
      return state.fetchedFonts[assetIndex]
    }
  }
}

const actions: ActionTree<IBrandKitState, unknown> = {
  async fetchBrands({ commit }) {
    try {
      const { data } = await brandkitApi.getBrands()
      if (data.flag !== 0) {
        throw new Error('fetch brands request failed')
      }
      const brands = data.brands
      commit('SET_brands', brands)
      commit('SET_currentBrand', brands[0] ?? { id: '' })
    } catch (error) {
      console.error(error)
      showNetworkError()
    }
  },
  async fetchFonts({ commit }) {
    try {
      const { data } = await brandkitApi.getFonts()
      if (data.flag !== 0) {
        throw new Error('fetch fonts request failed')
      }
      commit('SET_fontsPageIndex', data.next_page)
      commit('SET_fonts', data.data.font.content.map((font: IUserFontContentData) => brandkitUtils.apiFont2IBrandFont(font)))
    } catch (error) {
      console.error(error)
      showNetworkError()
    }
  },
  async fetchMoreFonts({ commit, getters }) {
    const pageIndex = getters.getFontsPageIndex
    if (pageIndex < 0) return
    try {
      const { data } = await brandkitApi.getFonts(undefined, undefined, {
        page_index: pageIndex
      })
      if (data.flag !== 0) {
        throw new Error('fetch fonts request failed')
      }
      commit('SET_fontsPageIndex', data.next_page)
      commit('SET_fonts', getters.getFonts.concat(data.data.font.content.map((font: IUserFontContentData) => brandkitUtils.apiFont2IBrandFont(font))))
    } catch (error) {
      console.error(error)
      showNetworkError()
    }
  },
  async setBrandName({ commit }, updateInfo: { brand: IBrand, newName: string }) {
    const { brand, newName } = updateInfo
    const oldName = brand.name
    brandkitApi.updateBrandsWrapper({
      type: 'brand',
      update_type: 'rename',
      src: brand.id,
      target: newName
    }, () => {
      brand.name = newName
    }, () => {
      brand.name = oldName
    }, () => {
      showNetworkError()
    })
  },
  async createBrand({ commit }) {
    const brand = brandkitUtils.createDefaultBrand()
    brandkitApi.updateBrandsWrapper({
      type: 'brand',
      update_type: 'create',
      src: brand.id
    }, () => {
      commit('UPDATE_addBrand', brand)
      commit('SET_currentBrand', brand)
    }, () => {
      commit('UPDATE_deleteBrand', brand)
    }, () => {
      showNetworkError()
    }, (data) => {
      const realCreateTime = data.createTime
      commit('UPDATE_replaceBrandTime', { brand, createTime: realCreateTime })
    })
  },
  async copyBrand({ commit }, brand: IBrand) {
    const newBrand = generalUtils.deepCopy(brand)
    newBrand.id = 'new_' + generalUtils.generateAssetId()
    newBrand.createTime = (new Date()).toISOString()
    brandkitApi.updateBrandsWrapper({
      type: 'brand',
      update_type: 'copy',
      src: brand.id
    }, () => {
      commit('UPDATE_addBrand', newBrand)
    }, () => {
      commit('UPDATE_deleteBrand', newBrand)
    }, () => {
      showNetworkError()
    }, (data) => {
      commit('UPDATE_replaceBrand', { id: newBrand.id, brand: data.data })
    })
  },
  async removeBrand({ commit, state }, brand: IBrand) {
    const needCreateDefault = state.brands.length <= 1
    const success = await brandkitApi.updateBrandsWrapper({
      type: 'brand',
      update_type: 'delete',
      src: brand.id
    }, () => {
      if (needCreateDefault) {
        commit('SET_isBrandsLoading', true)
      } else {
        commit('UPDATE_deleteBrand', brand)
      }
    }, () => {
      if (needCreateDefault) {
        commit('SET_isBrandsLoading', false)
      } else {
        commit('UPDATE_addBrand', brand)
      }
    }, () => {
      showNetworkError()
    })
    return needCreateDefault && success
  },
  async removeLogo({ commit }, logo: IBrandLogo) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    brandkitApi.updateBrandsWrapper({}, () => {
      commit('UPDATE_deleteLogo', { brand: currentBrand, logo })
    }, () => {
      commit('UPDATE_addLogo', { brand: currentBrand, logo })
    }, () => {
      showNetworkError()
    })
  },
  async removePalette({ commit }, palette: IBrandColorPalette) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    brandkitApi.updateBrandsWrapper({
      type: 'palette',
      update_type: 'delete',
      src: palette.id
    }, () => {
      commit('UPDATE_deletePalette', { brand: currentBrand, palette })
    }, () => {
      commit('UPDATE_addPalette', { brand: currentBrand, palette })
    }, () => {
      showNetworkError()
    })
  },
  async createPalette({ commit }) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    const palette = brandkitUtils.createDefaultPalette()
    brandkitApi.updateBrandsWrapper({
      type: 'palette',
      update_type: 'create',
      src: `${currentBrand.id},${palette.id},${palette.colors[0].id}`
    }, () => {
      commit('UPDATE_addPalette', { brand: currentBrand, palette })
    }, () => {
      commit('UPDATE_deletePalette', { brand: currentBrand, palette })
    }, () => {
      showNetworkError()
    }, (data) => {
      const realCreateTime = data.createTime
      commit('UPDATE_replacePaletteTime', { brand: currentBrand, palette, createTime: realCreateTime })
    })
    return palette.id
  },
  async setPaletteName({ commit }, updateInfo: { palette: IBrandColorPalette, newName: string }) {
    const { palette, newName } = updateInfo
    const oldName = palette.name
    brandkitApi.updateBrandsWrapper({
      type: 'palette',
      update_type: 'rename',
      src: palette.id,
      target: newName
    }, () => {
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
    brandkitApi.updateBrandsWrapper({
      type: 'color',
      update_type: 'delete',
      src: updateInfo.color.id
    }, () => {
      commit('UPDATE_deleteColor', { brand: currentBrand, ...updateInfo })
    }, () => {
      commit('UPDATE_addColor', { brand: currentBrand, ...updateInfo })
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
    brandkitApi.updateBrandsWrapper({
      type: 'color',
      update_type: 'create',
      src: `${palette.id},${newColor.id}`,
      target: newColor.color
    }, () => {
      commit('UPDATE_addColor', { brand: currentBrand, paletteId, color: newColor })
    }, () => {
      commit('UPDATE_deleteColor', { brand: currentBrand, paletteId, color: newColor })
    }, () => {
      showNetworkError()
    }, (data) => {
      const realCreateTime = data.createTime
      commit('UPDATE_replaceColorTime', { brand: currentBrand, palette, color: newColor, createTime: realCreateTime })
    })
  },
  async updateColor({ commit }, updateInfo: { id: string, color: string }) {
    return await brandkitApi.updateBrandsWrapper({
      type: 'color',
      update_type: 'update',
      src: updateInfo.id,
      target: updateInfo.color
    }, () => {
      // do nothing
    }, () => {
      // do nothing
    }, () => {
      showNetworkError()
    })
  },
  async updateColorTemp({ state, commit }, updateInfo: { paletteId: string, id: string, color: string }) {
    const currentBrand = brandkitUtils.findBrand(state.brands, state.currentBrandId)
    if (!currentBrand) return
    console.log('tmp')
    commit('UPDATE_setColor', { brand: currentBrand, ...updateInfo })
  },
  async removeFont({ commit }, font: IBrandFont) {
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
    // if current is default setting and property other than font is to be updated
    // add default font setting into updateInfo.style
    brandkitUtils.setDefaultFontInfo(currentBrand, updateInfo)
    const updateStyle = brandkitUtils.getUpdateStyleAPIEncoding(updateInfo.style)
    const currentStyle = brandkitUtils.getCurrentValues(currentBrand, updateInfo)
    await brandkitApi.updateBrandsWrapper({
      type: 'text',
      update_type: 'update',
      src: `${currentBrand.id},${updateInfo.type}`,
      target: updateStyle
    }, () => {
      commit('UPDATE_updateTextStyle', { brand: currentBrand, type: updateInfo.type, style: { ...updateInfo.style, isDefault: false } })
    }, () => {
      commit('UPDATE_updateTextStyle', { brand: currentBrand, type: updateInfo.type, style: currentStyle })
    }, () => {
      showNetworkError()
    })
  },
  async refreshFontAsset({ commit }, font: IBrandFont | string) {
    const assetIndex = typeof font === 'string' ? font as string : (font as IBrandFont).asset_index.toString()
    let privateFont: IBrandFont | undefined
    if (typeof font === 'string') {
      privateFont = brandkitUtils.getFont(font)
    } else {
      privateFont = font as IBrandFont
    }
    const { data } = await brandkitApi.getFont(assetIndex)
    if (data.flag === 0) {
      const urlMap = data.url_map[assetIndex]
      if (privateFont) {
        commit('UPDATE_replaceFontUrl', { font: privateFont, urlMap })
      }
      commit('UPDATE_addFetchedFont', { index: assetIndex, urlMap })
      return urlMap
    }
    return {}
  },
  async updatePageFonts({ dispatch }, { pageIndex }: { pageIndex: number }) {
    const { layers } = store.state.pages[pageIndex]
    const fontToRequest = new Set<string>()

    for (const layer of layers) {
      const targets = layer.type === 'group' ? (layer as IGroup).layers : [layer]

      for (const target of targets) {
        if (target.type === 'text') {
          const paragraphs = (target as IText).paragraphs
          for (const paragraph of paragraphs) {
            if (paragraph.styles.font && paragraph.styles.type === 'private') {
              fontToRequest.add(paragraph.styles.assetId as string)
            }
            for (const span of paragraph.spans) {
              if (span.styles.font && span.styles.type === 'private') {
                fontToRequest.add(span.styles.assetId)
              }
            }
          }
        }
      }
    }

    fontToRequest.delete('') // delete empty asset id
    await dispatch('updateFonts', { assetSet: fontToRequest })
  },
  async updateFonts({ commit }, { assetSet }: { assetSet: Set<string> }) {
    const assetIndexList = Array.from(assetSet)
    const assetIndex = assetIndexList.join(',')
    if (assetIndex.length === 0) {
      return
    }

    const { data } = await brandkitApi.getFont(assetIndex)
    if (data.flag === 0) {
      commit('UPDATE_setFetchedFont', data.url_map)
    }
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
  SET_isFontsLoading(state: IBrandKitState, isFontsLoading: boolean) {
    state.isFontsLoading = isFontsLoading
  },
  SET_selectedTab(state: IBrandKitState, selectedTab: string) {
    state.selectedTab = selectedTab
  },
  SET_fonts(state: IBrandKitState, fonts: IBrandFont[]) {
    state.fonts = fonts
  },
  SET_fontsPageIndex(state: IBrandKitState, fontsPageIndex: number) {
    state.fontsPageIndex = fontsPageIndex
  },
  UPDATE_addBrand(state: IBrandKitState, brand: IBrand) {
    const index = brandkitUtils.findInsertIndex(state.brands, brand, true)
    state.brands.splice(index, 0, brand)
  },
  UPDATE_deleteBrand(state: IBrandKitState, brand: IBrand) {
    const index = state.brands.findIndex(brand_ => brand_.id === brand.id)
    if (index < 0) return
    state.brands.splice(index, 1)
    if (state.currentBrandId === brand.id && state.brands.length > 0) {
      state.currentBrandId = state.brands[0].id
    }
  },
  UPDATE_replaceBrand(state: IBrandKitState, updateInfo: { id: string, brand: IBrand }) {
    const index = state.brands.findIndex(brand_ => brand_.id === updateInfo.id)
    if (index < 0) return
    state.brands.splice(index, 1, updateInfo.brand)
  },
  UPDATE_replaceBrandTime(state: IBrandKitState, updateInfo: { brand: IBrand, createTime: string }) {
    const brand = brandkitUtils.findBrand(state.brands, updateInfo.brand.id)
    if (!brand) return
    brand.createTime = updateInfo.createTime
  },
  UPDATE_addLogo(state: IBrandKitState, updateInfo: { brand: IBrand, logo: IBrandLogo }) {
    const brand = brandkitUtils.findBrand(state.brands, updateInfo.brand.id)
    if (!brand) return
    const index = brandkitUtils.findInsertIndex(brand.logos, updateInfo.logo)
    brand.logos.splice(index, 0, updateInfo.logo)
  },
  UPDATE_deleteLogo(state: IBrandKitState, updateInfo: { brand: IBrand, logo: IBrandLogo }) {
    const brand = brandkitUtils.findBrand(state.brands, updateInfo.brand.id)
    if (!brand) return
    const index = brand.logos.findIndex(logo_ => logo_.id === updateInfo.logo.id)
    if (index < 0) return
    brand.logos.splice(index, 1)
  },
  UPDATE_addPalette(state: IBrandKitState, updateInfo: { brand: IBrand, palette: IBrandColorPalette }) {
    const brand = brandkitUtils.findBrand(state.brands, updateInfo.brand.id)
    if (!brand) return
    const index = brandkitUtils.findInsertIndex(brand.colorPalettes, updateInfo.palette)
    brand.colorPalettes.splice(index, 0, updateInfo.palette)
  },
  UPDATE_deletePalette(state: IBrandKitState, updateInfo: { brand: IBrand, palette: IBrandColorPalette }) {
    const brand = brandkitUtils.findBrand(state.brands, updateInfo.brand.id)
    if (!brand) return
    const index = brand.colorPalettes.findIndex(palette_ => palette_.id === updateInfo.palette.id)
    if (index < 0) return
    brand.colorPalettes.splice(index, 1)
  },
  UPDATE_replacePaletteTime(state: IBrandKitState, updateInfo: { brand: IBrand, palette: IBrandColorPalette, createTime: string }) {
    const brand = brandkitUtils.findBrand(state.brands, updateInfo.brand.id)
    if (!brand) return
    const colorPalette = brand.colorPalettes.find(palette => palette.id === updateInfo.palette.id)
    if (!colorPalette) return
    colorPalette.createTime = updateInfo.createTime
  },
  UPDATE_addColor(state: IBrandKitState, updateInfo: { brand: IBrand, paletteId: string, color: IBrandColor }) {
    const brand = brandkitUtils.findBrand(state.brands, updateInfo.brand.id)
    if (!brand) return
    const colorPalette = brand.colorPalettes.find(palette => palette.id === updateInfo.paletteId)
    if (!colorPalette) return
    const index = brandkitUtils.findInsertIndex(colorPalette.colors, updateInfo.color, true)
    colorPalette.colors.splice(index, 0, updateInfo.color)
  },
  UPDATE_deleteColor(state: IBrandKitState, updateInfo: { brand: IBrand, paletteId: string, color: IBrandColor }) {
    const brand = brandkitUtils.findBrand(state.brands, updateInfo.brand.id)
    if (!brand) return
    const colorPalette = brand.colorPalettes.find(palette => palette.id === updateInfo.paletteId)
    if (!colorPalette) return
    const index = colorPalette.colors.findIndex(color => color.id === updateInfo.color.id)
    if (index < 0) return
    colorPalette.colors.splice(index, 1)
  },
  UPDATE_setColor(state: IBrandKitState, updateInfo: { brand: IBrand, paletteId: string, id: string, color: string }) {
    console.log(updateInfo.color)
    const brand = brandkitUtils.findBrand(state.brands, updateInfo.brand.id)
    if (!brand) return
    const colorPalette = brand.colorPalettes.find(palette => palette.id === updateInfo.paletteId)
    if (!colorPalette) return
    const index = colorPalette.colors.findIndex(color => color.id === updateInfo.id)
    if (index < 0) return
    const oldColor = colorPalette.colors[index]
    colorPalette.colors.splice(index, 1, { ...oldColor, color: updateInfo.color })
  },
  UPDATE_replaceColorTime(state: IBrandKitState, updateInfo: { brand: IBrand, paletteId: string, color: IBrandColor, createTime: string }) {
    const brand = brandkitUtils.findBrand(state.brands, updateInfo.brand.id)
    if (!brand) return
    const colorPalette = brand.colorPalettes.find(palette => palette.id === updateInfo.paletteId)
    if (!colorPalette) return
    const index = colorPalette.colors.findIndex(color => color.id === updateInfo.color.id)
    if (index < 0) return
    const color = colorPalette.colors[index]
    color.createTime = updateInfo.createTime
  },
  UPDATE_deleteFont(state: IBrandKitState, font: IBrandFont) {
    const index = state.fonts.findIndex(font_ => font_.id === font.id)
    if (index < 0) return
    state.fonts.splice(index, 1)
  },
  UPDATE_addFont(state: IBrandKitState, font: IBrandFont) {
    const index = brandkitUtils.findInsertIndex(state.fonts, font)
    state.fonts.splice(index, 0, font)
  },
  UPDATE_replaceFont(state: IBrandKitState, updateInfo: { id: string, font: IBrandFont }) {
    const index = state.fonts.findIndex(font_ => font_.id === updateInfo.id)
    if (index < 0) return
    state.fonts.splice(index, 1, updateInfo.font)
  },
  UPDATE_replaceFontUrl(state: IBrandKitState, updateInfo: { font: IBrandFont, urlMap: {[key: string]: string} }) {
    const font = state.fonts.find(font_ => font_.id === updateInfo.font.id)
    if (!font || !font.signed_url) return
    for (const key of Object.keys(font.signed_url)) {
      (font.signed_url as any)[key] = updateInfo.urlMap[key] ?? ''
    }
  },
  UPDATE_addFetchedFont(state: IBrandKitState, updateInfo: { index: string, urlMap: {[key: string]: string} }) {
    state.fetchedFonts[updateInfo.index] = updateInfo.urlMap
  },
  UPDATE_setFetchedFont(state: IBrandKitState, urlMap: {[key: string]: {[key: string]: string}}) {
    Object.assign(state.fetchedFonts, urlMap)
  },
  UPDATE_updateTextStyle(state: IBrandKitState, updateInfo: { brand: IBrand, type: string, style: any }) {
    const brand = brandkitUtils.findBrand(state.brands, updateInfo.brand.id)
    if (!brand) return
    const textStyle = (brand.textStyleSetting as any)[`${updateInfo.type}Style`]
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
