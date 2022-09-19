import { IAsset } from '@/interfaces/module'
import { GetterTree, MutationTree, ActionTree } from 'vuex'

interface IViviStickerState {
  currActiveTab: string,
  isInCategoryDict: {[key: string]: boolean},
  isInBgShare: boolean,
  shareItem: IAsset | undefined,
  shareColor: string,
  editorBgIndex: number,
  editorType: string,
  controllerHidden: boolean
}

const EDITOR_BGS = [
  '#2E2E2E',
  '#F4F5F7'
]

const getDefaultState = (): IViviStickerState => ({
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
  controllerHidden: false
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
