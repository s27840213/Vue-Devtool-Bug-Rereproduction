import { IAsset } from '@/interfaces/module'
import { IFullPageConfig, IMyDesign, IPayment, IPaymentPending, IPrices, IUserInfo, IUserSettings } from '@/interfaces/vivisticker'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import _ from 'lodash'
import { ActionTree, GetterTree, MutationTree } from 'vuex'

interface IViviStickerState {
  userInfo: IUserInfo,
  userSettings: IUserSettings,
  currActiveTab: string,
  isInCategoryDict: { [key: string]: boolean },
  showAllRecentlyDict: { [key: string]: boolean },
  isInBgShare: boolean,
  isInGroupTemplate: boolean,
  isInBgRemoveSection: boolean,
  shareItem: IAsset | undefined,
  shareColor: string,
  editorBgIndex: number,
  editorType: string,
  controllerHidden: boolean,
  isStandaloneMode: boolean,
  showTutorial: boolean,
  fullPageConfig: IFullPageConfig,
  recentlyBgColors: string[],
  hasNewBgColor: boolean,
  isDuringCopy: boolean,
  isInMyDesign: boolean,
  myDesignTab: string,
  isInSelectionMode: boolean,
  debugMode: boolean,
  slideType: string,
  myDesignFiles: { [key: string]: IMyDesign[] },
  myDesignNextPages: { [key: string]: number },
  myDesignBuffer: IMyDesign | undefined,
  editingDesignId: string,
  editingAssetInfo: { [key: string]: any },
  selectedDesigns: { [key: string]: IMyDesign },
  modalInfo: { [key: string]: any },
  payment: IPayment,
  uuid: string,
  loadedFonts: { [key: string]: true },
  templateShareType: 'none' | 'story' | 'post',
}

const EDITOR_BGS = [
  '#2E2E2E',
  '#F4F5F7'
]

const getDefaultState = (): IViviStickerState => ({
  userInfo: vivistickerUtils.getDefaultUserInfo(),
  userSettings: vivistickerUtils.getDefaultUserSettings(),
  currActiveTab: 'object',
  isInCategoryDict: {
    object: false,
    background: false,
    text: false
  },
  showAllRecentlyDict: {
    object: false,
    background: false,
    text: false
  },
  isInBgShare: false,
  isInGroupTemplate: false,
  isInBgRemoveSection: false,
  shareItem: undefined,
  shareColor: '',
  editorBgIndex: 0,
  editorType: 'none',
  controllerHidden: false,
  isStandaloneMode: false,
  showTutorial: false,
  fullPageConfig: {
    type: 'none',
    params: {}
  },
  recentlyBgColors: [],
  hasNewBgColor: false,
  isDuringCopy: false,
  isInMyDesign: false,
  myDesignTab: 'text',
  isInSelectionMode: false,
  slideType: 'none',
  myDesignFiles: vivistickerUtils.getDefaultMyDesignFiles(),
  myDesignNextPages: vivistickerUtils.getDefaultMyDesignNextPages(),
  myDesignBuffer: undefined,
  editingDesignId: '',
  editingAssetInfo: {},
  selectedDesigns: {},
  modalInfo: {},
  payment: {
    subscribe: false,
    prices: {
      currency: '',
      monthly: {
        value: NaN,
        text: ''
      },
      annually: {
        value: NaN,
        text: ''
      },
    },
    pending: {
      info: true,
      purchase: false,
      restore: false
    }
  },
  uuid: '',
  loadedFonts: {},
  debugMode: false,
  templateShareType: 'none'
})

const state = getDefaultState()
const getters: GetterTree<IViviStickerState, unknown> = {
  getUserInfo(state: IViviStickerState): IUserInfo {
    return state.userInfo
  },
  getUserSettings(state: IViviStickerState): IUserSettings {
    return state.userSettings
  },
  getCurrActiveTab(state: IViviStickerState): string {
    return state.currActiveTab
  },
  getIsInEditor(state: IViviStickerState): boolean {
    return state.editorType !== 'none'
  },
  getEditorTypeTextLike(state: IViviStickerState): boolean {
    return ['objectGroup', 'text'].includes(state.editorType)
  },
  getEditorTypeTemplate(state: IViviStickerState): boolean {
    return ['story', 'post'].includes(state.editorType)
  },
  getIsInCategory(state: IViviStickerState): (tab: string) => boolean {
    return (tab: string): boolean => state.isInCategoryDict[tab] ?? false
  },
  getShowAllRecently(state: IViviStickerState): (tab: string) => boolean {
    return (tab: string): boolean => state.showAllRecentlyDict[tab] ?? false
  },
  getIsInBgShare(state: IViviStickerState): boolean {
    return state.isInBgShare
  },
  getIsInTemplateShare(state: IViviStickerState): boolean {
    return state.templateShareType !== 'none'
  },
  getIsInGroupTemplate(state: IViviStickerState): boolean {
    return state.isInGroupTemplate
  },
  getShareItem(state: IViviStickerState): IAsset | undefined {
    return state.shareItem
  },
  getShareColor(state: IViviStickerState): string {
    return state.shareColor
  },
  getEditorBgIndex(state: IViviStickerState): number {
    return state.editorBgIndex
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
  getIsInBgRemoveSection(state: IViviStickerState): boolean {
    return state.isInBgRemoveSection
  },
  getShowTutorial(state: IViviStickerState): boolean {
    return state.showTutorial
  },
  getFullPageConfig(state: IViviStickerState): IFullPageConfig {
    return state.fullPageConfig
  },
  getFullPageType(state: IViviStickerState): IFullPageConfig['type'] {
    return state.fullPageConfig.type
  },
  getFullPageParams(state: IViviStickerState): IFullPageConfig['params'] {
    return state.fullPageConfig.params
  },
  getRecentlyBgColors(state: IViviStickerState): string[] {
    return state.recentlyBgColors
  },
  getHasNewBgColor(state: IViviStickerState): boolean {
    return state.hasNewBgColor
  },
  getIsDuringCopy(state: IViviStickerState): boolean {
    return state.isDuringCopy
  },
  getIsInMyDesign(state: IViviStickerState): boolean {
    return state.isInMyDesign
  },
  getMyDesignTab(state: IViviStickerState): string {
    return state.myDesignTab
  },
  getIsInSelectionMode(state: IViviStickerState): boolean {
    return state.isInSelectionMode
  },
  getSlideType(state: IViviStickerState): string {
    return state.slideType
  },
  getIsSlideShown(state: IViviStickerState): boolean {
    return state.slideType !== 'none'
  },
  getMyDesignFileList(state: IViviStickerState): (tab: string) => IMyDesign[] {
    return (tab: string): IMyDesign[] => {
      return state.myDesignFiles[tab] ?? []
    }
  },
  getMyDesignNextPage(state: IViviStickerState): (tab: string) => number {
    return (tab: string): number => {
      return state.myDesignNextPages[tab] ?? -1
    }
  },
  getMyDesignBuffer(state: IViviStickerState): IMyDesign | undefined {
    return state.myDesignBuffer
  },
  getEditingDesignId(state: IViviStickerState): string {
    return state.editingDesignId
  },
  getEditingAssetInfo(state: IViviStickerState): { [key: string]: any } {
    return state.editingAssetInfo
  },
  getSelectedDesigns(state: IViviStickerState): { [key: string]: IMyDesign } {
    return state.selectedDesigns
  },
  getModalInfo(state: IViviStickerState): { [key: string]: string } {
    return state.modalInfo
  },
  getLoadedFonts(state: IViviStickerState): { [key: string]: true } {
    return state.loadedFonts
  },
  getPrices(state: IViviStickerState): IPrices {
    return state.payment.prices
  },
  getIsPaymentPending(state) {
    return Object.entries(state.payment.pending).some(([key, value]) => value)
  },
  getIsSubscribed(state: IViviStickerState): boolean {
    return state.payment.subscribe
  },
  getUuid(state: IViviStickerState): string {
    return state.uuid
  },
  getDebugMode(state: IViviStickerState): boolean {
    return state.debugMode
  }
}

const actions: ActionTree<IViviStickerState, unknown> = {
  async updateUserSettings({ commit, getters }, settings: Partial<IUserSettings>) {
    commit('UPDATE_userSettings', settings)
    await vivistickerUtils.setState('userSettings', getters.getUserSettings)
  }
}

const mutations: MutationTree<IViviStickerState> = {
  SET_userInfo(state: IViviStickerState, userInfo: IUserInfo) {
    state.userInfo = userInfo
  },
  SET_userSettings(state: IViviStickerState, userSettings: IUserSettings) {
    state.userSettings = userSettings
  },
  SET_currActiveTab(state: IViviStickerState, panel: string) {
    state.currActiveTab = panel
  },
  SET_isInCategory(state: IViviStickerState, updateInfo: { tab: string, bool: boolean }) {
    state.isInCategoryDict[updateInfo.tab] = updateInfo.bool
  },
  SET_showAllRecently(state: IViviStickerState, updateInfo: { tab: string, bool: boolean }) {
    state.showAllRecentlyDict[updateInfo.tab] = updateInfo.bool
  },
  SET_isInBgShare(state: IViviStickerState, bool: boolean) {
    state.isInBgShare = bool
  },
  SET_isInGroupTemplate(state: IViviStickerState, bool: boolean) {
    state.isInGroupTemplate = bool
  },
  SET_shareItem(state: IViviStickerState, shareItem: IAsset | undefined) {
    state.shareItem = shareItem
  },
  SET_shareColor(state: IViviStickerState, shareColor: string) {
    state.shareColor = shareColor
  },
  SET_editorBgIndex(state: IViviStickerState, editorBgIndex: number) {
    state.editorBgIndex = editorBgIndex
  },
  SET_editorBg(state: IViviStickerState, editorBg: string) {
    const index = EDITOR_BGS.findIndex(bg => bg === editorBg)
    if (index >= 0) {
      state.editorBgIndex = index
    }
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
  SET_showTutorial(state: IViviStickerState, showTutorial: boolean) {
    state.showTutorial = showTutorial
  },
  SET_fullPageType(state: IViviStickerState, fullPageType: IFullPageConfig['type']) {
    state.fullPageConfig.type = fullPageType
  },
  SET_fullPageParams(state: IViviStickerState, fullPageParams: IFullPageConfig['params']) {
    state.fullPageConfig.params = fullPageParams
  },
  SET_fullPageConfig(state: IViviStickerState, data: IFullPageConfig) {
    state.fullPageConfig = data
  },
  UPDATE_clearFullPageConfig(state: IViviStickerState) {
    state.fullPageConfig = {
      type: 'none',
      params: {}
    }
  },
  SET_recentlyBgColors(state: IViviStickerState, recentlyBgColors: string[]) {
    state.recentlyBgColors = recentlyBgColors
  },
  SET_hasNewBgColor(state: IViviStickerState, hasNewBgColor: boolean) {
    state.hasNewBgColor = hasNewBgColor
  },
  SET_isDuringCopy(state: IViviStickerState, isDuringCopy: boolean) {
    state.isDuringCopy = isDuringCopy
  },
  SET_isInMyDesign(state: IViviStickerState, isInMyDesign: boolean) {
    state.isInMyDesign = isInMyDesign
  },
  SET_isInBgRemoveSection(state: IViviStickerState, isInBgRemoveSection: boolean) {
    state.isInBgRemoveSection = isInBgRemoveSection
  },
  SET_myDesignTab(state: IViviStickerState, myDesignTab: string) {
    state.myDesignTab = myDesignTab
  },
  SET_isInSelectionMode(state: IViviStickerState, isInSelectionMode: boolean) {
    state.isInSelectionMode = isInSelectionMode
  },
  SET_slideType(state: IViviStickerState, slideType: string) {
    state.slideType = slideType
  },
  SET_myDesignFileList(state: IViviStickerState, updateInfo: { tab: string, list: IMyDesign[] }) {
    state.myDesignFiles[updateInfo.tab] = state.myDesignFiles[updateInfo.tab].concat(updateInfo.list)
  },
  SET_myDesignNextPage(state: IViviStickerState, updateInfo: { tab: string, nextPage: number }) {
    state.myDesignNextPages[updateInfo.tab] = updateInfo.nextPage
  },
  SET_myDesignBuffer(state: IViviStickerState, myDesignBuffer: IMyDesign | undefined) {
    state.myDesignBuffer = myDesignBuffer
  },
  SET_editingDesignId(state: IViviStickerState, editingDesignId: string) {
    state.editingDesignId = editingDesignId
  },
  SET_editingAssetInfo(state: IViviStickerState, editingAssetInfo: { [key: string]: any }) {
    state.editingAssetInfo = editingAssetInfo
  },
  SET_modalInfo(state: IViviStickerState, modalInfo: { [key: string]: any }) {
    state.modalInfo = modalInfo
  },
  UPDATE_payment(state: IViviStickerState, data: Partial<IPayment>) {
    Object.entries(data).forEach(([key, value]) => {
      (state.payment as any)[key] = value
    })
  },
  SET_paymentPending(state: IViviStickerState, data: Record<keyof IPaymentPending, boolean>) {
    for (const item of Object.entries(data)) {
      state.payment.pending[item[0] as keyof IPaymentPending] = item[1]
    }
  },
  SET_uuid(state: IViviStickerState, uuid: string) {
    state.uuid = uuid
  },
  SET_loadedFonts(state: IViviStickerState, loadedFonts: { [key: string]: true }) {
    state.loadedFonts = loadedFonts
  },
  SET_debugMode(state: IViviStickerState, debugMode: boolean) {
    state.debugMode = debugMode
  },
  UPDATE_userSettings(state: IViviStickerState, settings: Partial<IUserSettings>) {
    Object.entries(settings).forEach(([key, value]) => {
      (state.userSettings as any)[key] = value
    })
  },
  UPDATE_addRecentlyBgColor(state: IViviStickerState, recentlyBgColor: string) {
    let recently = state.recentlyBgColors
    recently = _.without(recently, recentlyBgColor)
    recently = [recentlyBgColor].concat(recently)
    state.recentlyBgColors = recently
  },
  UPDATE_switchBg(state: IViviStickerState) {
    state.editorBgIndex = (state.editorBgIndex + 1) % EDITOR_BGS.length
  },
  UPDATE_resetMyDesignFileList(state: IViviStickerState, tab: string) {
    if (state.myDesignNextPages[tab] === undefined) return
    state.myDesignFiles[tab] = []
    state.myDesignNextPages[tab] = -1
  },
  UPDATE_deleteDesign(state: IViviStickerState, updateInfo: { tab: string, id: string }) {
    const list = state.myDesignFiles[updateInfo.tab]
    if (!list) return
    const index = list.findIndex(d => d.id === updateInfo.id)
    if (index < 0) return
    list.splice(index, 1)
  },
  UPDATE_deleteDesigns(state: IViviStickerState, tab: string) {
    const list = state.myDesignFiles[tab]
    for (const design of Object.values(state.selectedDesigns)) {
      const index = list.findIndex(d => d.id === design.id)
      if (index < 0) continue
      list.splice(index, 1)
    }
  },
  // UPDATE_updateDesign(state: IViviStickerState, updateInfo: { tab: string, design: IMyDesign }) {
  //   const list = state.myDesignFiles[updateInfo.tab]
  //   if (!list) return
  //   const designIndex = list.findIndex(d => d.id === updateInfo.design.id)
  //   if (designIndex < 0) return
  //   const design = list.splice(designIndex, 1)[0]
  //   Object.assign(design, updateInfo.design)
  //   design.ver = generalUtils.generateRandomString(12)
  //   list.unshift(design)
  // },
  UPDATE_updateDesignThumb(state: IViviStickerState, updateInfo: { tab: string, id: string }) {
    const list = state.myDesignFiles[updateInfo.tab]
    if (!list) return
    const designIndex = list.findIndex(d => d.id === updateInfo.id)
    if (designIndex < 0) return
    const design = list.splice(designIndex, 1)[0]
    design.ver = generalUtils.generateRandomString(12)
    list.unshift(design)
  },
  UPDATE_selectDesign(state: IViviStickerState, design: IMyDesign) {
    state.selectedDesigns[design.id] = design
  },
  UPDATE_deselectDesign(state: IViviStickerState, design: IMyDesign) {
    delete state.selectedDesigns[design.id]
  },
  UPDATE_selectAllDesigns(state: IViviStickerState, tab: string) {
    const newSelection = {} as { [key: string]: IMyDesign }
    for (const design of state.myDesignFiles[tab]) {
      newSelection[design.id] = design
    }
    state.selectedDesigns = newSelection
  },
  UPDATE_clearSelectedDesigns(state: IViviStickerState) {
    state.selectedDesigns = {}
  },
  UPDATE_addLoadedFont(state: IViviStickerState, font: string) {
    state.loadedFonts[font] = true
  },
  SET_templateShareType(state: IViviStickerState, type: 'none' | 'story' | 'post') {
    state.templateShareType = type
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
