import { IAsset } from '@/interfaces/module'
import { GetterTree, MutationTree, ActionTree } from 'vuex'

interface IViviStickerState {
  currActiveTab: string,
  isInEditor: boolean,
  isInCategoryDict: {[key: string]: boolean},
  isInBgShare: boolean,
  shareItem: IAsset | undefined,
  shareColor: string
}

const getDefaultState = (): IViviStickerState => ({
  currActiveTab: 'object',
  isInEditor: false,
  isInCategoryDict: {
    object: false,
    background: false
  },
  isInBgShare: false,
  shareItem: undefined,
  shareColor: ''
})

const state = getDefaultState()
const getters: GetterTree<IViviStickerState, unknown> = {
  getCurrActiveTab(state: IViviStickerState): string {
    return state.currActiveTab
  },
  getIsInEditor(state: IViviStickerState): boolean {
    return state.isInEditor
  },
  getIsInCategory(state: IViviStickerState): (tab: string) => boolean {
    return (tab: string): boolean => state.isInCategoryDict[tab] ?? false
  },
  getIsInBgShare(state: IViviStickerState): boolean {
    return state.isInBgShare
  },
  getShareItem(state: IViviStickerState): IAsset | undefined {
    return state.shareItem
  },
  getShareColor(state: IViviStickerState): string {
    return state.shareColor
  }
}

const mutations: MutationTree<IViviStickerState> = {
  SET_currActiveTab(state: IViviStickerState, panel: string) {
    state.currActiveTab = panel
  },
  SET_isInEditor(state: IViviStickerState, bool: boolean) {
    state.isInEditor = bool
  },
  SET_isInCategory(state: IViviStickerState, updateInfo: { tab: string, bool: boolean }) {
    state.isInCategoryDict[updateInfo.tab] = updateInfo.bool
  },
  SET_isInBgShare(state: IViviStickerState, bool: boolean) {
    state.isInBgShare = bool
  },
  SET_shareItem(state: IViviStickerState, shareItem: IAsset | undefined) {
    state.shareItem = shareItem
  },
  SET_shareColor(state: IViviStickerState, shareColor: string) {
    state.shareColor = shareColor
  }
}

const actions: ActionTree<IViviStickerState, unknown> = {
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
