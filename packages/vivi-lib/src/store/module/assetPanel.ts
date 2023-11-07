import generalUtils from '@/utils/generalUtils'
import { GetterTree, MutationTree } from 'vuex'

export interface IAssetPanelState {
  currActiveTab: string,
  currActiveObjectFavTab: string,
  isInCategoryDict: { [key: string]: boolean },
  showAllRecentlyDict: { [key: string]: boolean },
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
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}