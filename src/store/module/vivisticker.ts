import { IAsset } from '@/interfaces/module'
import { IUserInfo } from '@/interfaces/vivisticker'
import vivistickerUtils from '@/utils/vivistickerUtils'
import _ from 'lodash'
import { GetterTree, MutationTree, ActionTree } from 'vuex'

interface IViviStickerState {
  userInfo: IUserInfo,
  currActiveTab: string,
  isInCategoryDict: {[key: string]: boolean},
  isInBgShare: boolean,
  shareItem: IAsset | undefined,
  shareColor: string,
  editorBgIndex: number,
  editorType: string,
  controllerHidden: boolean,
  isStandaloneMode: boolean,
  showTutorial: boolean,
  recentlyBgColors: string[]
}

const EDITOR_BGS = [
  '#2E2E2E',
  '#F4F5F7'
]

const getDefaultState = (): IViviStickerState => ({
  userInfo: vivistickerUtils.getDefaultUserInfo(),
  currActiveTab: 'object',
  isInCategoryDict: {
    object: false,
    background: false,
    text: false
  },
  isInBgShare: false,
  shareItem: undefined,
  shareColor: '',
  editorBgIndex: 0,
  editorType: 'none',
  controllerHidden: false,
  isStandaloneMode: false,
  showTutorial: false,
  recentlyBgColors: []
})

const state = getDefaultState()
const getters: GetterTree<IViviStickerState, unknown> = {
  getCurrActiveTab(state: IViviStickerState): string {
    return state.currActiveTab
  },
  getIsInEditor(state: IViviStickerState): boolean {
    return state.editorType !== 'none'
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
  },
  getEditorBg(state: IViviStickerState): string {
    return EDITOR_BGS[state.editorBgIndex] ?? EDITOR_BGS[0]
  },
  getEditorType(state: IViviStickerState): string {
    return state.editorType
  },
  getControllerHidden(state: IViviStickerState): boolean {
    return state.controllerHidden
  },
  getIsStandaloneMode(state: IViviStickerState): boolean {
    return state.isStandaloneMode
  },
  getUserInfo(state: IViviStickerState): IUserInfo {
    return state.userInfo
  },
  getShowTutorial(state: IViviStickerState): boolean {
    return state.showTutorial
  },
  getRecentlyBgColors(state: IViviStickerState): string[] {
    return state.recentlyBgColors
  }
}

const mutations: MutationTree<IViviStickerState> = {
  SET_currActiveTab(state: IViviStickerState, panel: string) {
    state.currActiveTab = panel
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
  },
  SET_editorType(state: IViviStickerState, editorType: string) {
    state.editorType = editorType
  },
  SET_controllerHidden(state: IViviStickerState, controllerHidden: boolean) {
    state.controllerHidden = controllerHidden
  },
  SET_isStandaloneMode(state: IViviStickerState, isStandaloneMode: boolean) {
    state.isStandaloneMode = isStandaloneMode
  },
  SET_userInfo(state: IViviStickerState, userInfo: IUserInfo) {
    state.userInfo = userInfo
  },
  SET_showTutorial(state: IViviStickerState, showTutorial: boolean) {
    state.showTutorial = showTutorial
  },
  SET_recentlyBgColors(state: IViviStickerState, recentlyBgColors: string[]) {
    state.recentlyBgColors = recentlyBgColors
  },
  UPDATE_addRecentlyBgColor(state: IViviStickerState, recentlyBgColor: string) {
    let recently = state.recentlyBgColors
    recently = _.without(recently, recentlyBgColor)
    recently = [recentlyBgColor].concat(recently)
    state.recentlyBgColors = recently
  },
  UPDATE_switchBg(state: IViviStickerState) {
    state.editorBgIndex = (state.editorBgIndex + 1) % EDITOR_BGS.length
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
