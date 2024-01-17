import generalUtils from '@/utils/generalUtils'
import { ActionTree, GetterTree, MutationTree } from 'vuex'
import store from '@/store'

export interface IAssetPanelState {
  currActiveTab: string,
  currActiveObjectFavTab: string,
  isInCategoryDict: { [key: string]: boolean },
  showAllRecentlyDict: { [key: string]: boolean },
  isHiddenMessage: boolean
}

const tabs = generalUtils.isStk ? ['object', 'background', 'text', 'template']
  : generalUtils.isCm ? ['object', 'text']
  : []

function getDefaultDict<T>(defaultValue: T): { [key: string]: T } {
  const res = {} as { [key: string]: T }
  for (const tab of tabs) {
    res[tab] = defaultValue
  }
  return res
} // T will be auto inferred from defaultValue without specifying in <T> when calling

const getDefaultState = (): IAssetPanelState => ({
  currActiveTab: generalUtils.isStk ? 'object' : 'none',
  currActiveObjectFavTab: '',
  isInCategoryDict: getDefaultDict(false),
  showAllRecentlyDict: getDefaultDict(false),
  isHiddenMessage: false
})

const state = getDefaultState()
const getters: GetterTree<IAssetPanelState, unknown> = {
  getCurrActiveTab(state: IAssetPanelState): string {
    return state.currActiveTab
  },
  getShowActiveTab(state: IAssetPanelState): boolean {
    return state.currActiveTab !== 'none'
  },
  getCurrActiveObjectFavTab(state: IAssetPanelState): string {
    return state.currActiveObjectFavTab
  },
  getIsInCategory(state: IAssetPanelState): (tab: string) => boolean {
    return (tab: string): boolean => state.isInCategoryDict[tab] ?? false
  },
  getShowAllRecently(state: IAssetPanelState): (tab: string) => boolean {
    return (tab: string): boolean => state.showAllRecentlyDict[tab] ?? false
  },
  getIsHm(state: IAssetPanelState): number {
    return state.isHiddenMessage ? 1 : 0
  },
}

const mutations: MutationTree<IAssetPanelState> = {
  SET_currActiveTab(state: IAssetPanelState, panel: string) {
    state.currActiveTab = panel
  },
  SET_currActiveObjectFavTab(state: IAssetPanelState, tab: string) {
    state.currActiveObjectFavTab = tab
  },
  SET_isInCategory(state: IAssetPanelState, updateInfo: { tab: string, bool: boolean }) {
    state.isInCategoryDict[updateInfo.tab] = updateInfo.bool
  },
  SET_showAllRecently(state: IAssetPanelState, updateInfo: { tab: string, bool: boolean }) {
    state.showAllRecentlyDict[updateInfo.tab] = updateInfo.bool
  },
  SET_isHiddenMessage(state: IAssetPanelState, bool: boolean) {
    state.isHiddenMessage = bool
  }
}

const actions: ActionTree<IAssetPanelState, unknown> = {
  setIsHiddenMessage: ({ commit, state }, value: boolean) => {
    if (state.isHiddenMessage === value) return
    commit('SET_isHiddenMessage', value)
    store.dispatch('objects/resetContent')
    store.dispatch('objects/resetSearch')
    store.dispatch('textStock/resetContent')
    store.dispatch('textStock/resetSearch')
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
