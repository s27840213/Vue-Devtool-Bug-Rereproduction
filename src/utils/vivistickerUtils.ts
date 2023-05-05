import listApis from '@/apis/list'
import userApis from '@/apis/user'
import i18n from '@/i18n'
import { IListServiceContentDataItem } from '@/interfaces/api'
import { IFrame, IGroup, IImage, ILayer, IShape, IText } from '@/interfaces/layer'
import { IAsset } from '@/interfaces/module'
import { IPage } from '@/interfaces/page'
import { IIosImgData, IMyDesign, IMyDesignTag, IPrices, ISubscribeInfo, ISubscribeResult, ITempDesign, IUserInfo, IUserSettings, isV1_26 } from '@/interfaces/vivisticker'
import { WEBVIEW_API_RESULT } from '@/interfaces/webView'
import store from '@/store'
import { ColorEventType, LayerType } from '@/store/types'
import { nextTick } from 'vue'
import assetUtils from './assetUtils'
import colorUtils from './colorUtils'
import editorUtils from './editorUtils'
import eventUtils, { PanelEvent } from './eventUtils'
import frameUtils from './frameUtils'
import generalUtils from './generalUtils'
import groupUtils from './groupUtils'
import imageUtils from './imageUtils'
import layerUtils from './layerUtils'
import localeUtils from './localeUtils'
import modalUtils from './modalUtils'
import pageUtils from './pageUtils'
import stepsUtils from './stepsUtils'
import textPropUtils from './textPropUtils'
import textUtils from './textUtils'
import uploadUtils from './uploadUtils'
import { WebViewUtils } from './webViewUtils'

export type IViviStickerProFeatures = 'object' | 'text' | 'background' | 'frame' | 'template'

/**
 * shown prop indicates if the user-setting-config is shown in the setting page
 */
const USER_SETTINGS_CONFIG: { [key: string]: { default: any, description: string, shown: boolean, val?: any } } = {
  autoSave: {
    default: false,
    description: 'STK0012',
    shown: true
  },
  mydesignShowMissingPhotoAsk: {
    default: true,
    description: 'STK0036',
    shown: false,
    val: true
  }
}

export const MODULE_TYPE_MAPPING: { [key: string]: string } = {
  objects: 'svg',
  textStock: 'text',
  background: 'background',
  font: 'font'
}

const MYDESIGN_TAGS = [{
  name: 'NN0005',
  tab: 'text'
}, {
  name: 'NN0003',
  tab: 'object'
}] as IMyDesignTag[]

class ViviStickerUtils extends WebViewUtils<IUserInfo> {
  appLoadedSent = false
  isAnyIOSImgOnError = false
  hasCopied = false
  everEntersDebugMode = false
  loadingFlags = {} as { [key: string]: boolean }
  loadingCallback = undefined as (() => void) | undefined
  editorStateBuffer = {} as { [key: string]: any }
  designDeletionQueue = [] as { key: string, id: string, thumbType: string }[]

  STANDALONE_USER_INFO: IUserInfo = {
    hostId: '',
    appVer: '100.0',
    locale: 'us',
    isFirstOpen: false,
    editorBg: '',
    osVer: '100.0',
    modelName: '',
  }

  ROUTER_CALLBACKS = [
    'loginResult',
    'getStateResult',
    'setStateDone',
    'subscribeInfo'
  ]

  VVSTK_CALLBACKS = [
    'updateInfoDone',
    'listAssetResult',
    'copyDone',
    'thumbDone',
    'addAssetDone',
    'deleteAssetDone',
    'getAssetResult',
    'uploadImageURL',
    'informWebResult',
    'subscribeResult'
  ]

  SCREENSHOT_CALLBACKS = [
    'thumbDone',
    'updateFileDone',
    'informWebResult'
  ]

  CALLBACK_MAPS = {
    router: this.ROUTER_CALLBACKS,
    vvstk: this.VVSTK_CALLBACKS,
    screenshot: this.SCREENSHOT_CALLBACKS
  }

  get editorType(): string {
    return store.getters['vivisticker/getEditorType']
  }

  get editorTypeTextLike(): string {
    return store.getters['vivisticker/getEditorTypeTextLike']
  }

  get controllerHidden(): boolean {
    return store.getters['vivisticker/getControllerHidden']
  }

  get isStandaloneMode(): boolean {
    return store.getters['vivisticker/getIsStandaloneMode']
  }

  get userSettings(): IUserSettings {
    return store.getters['vivisticker/getUserSettings']
  }

  get isPaymentDisabled(): boolean {
    return !this.checkVersion('1.26')
  }

  getUserInfoFromStore(): IUserInfo {
    return store.getters['vivisticker/getUserInfo']
  }

  appendModuleName(identifier: string): string {
    return `vivisticker/${identifier}`
  }

  getDefaultUserSettings(): IUserSettings {
    const res = {} as { [key: string]: any }
    for (const [key, value] of Object.entries(USER_SETTINGS_CONFIG)) {
      if (value.shown) {
        res[key] = value.default
      }
    }
    return res as IUserSettings
  }

  getUserSettingDescription(key: string): string {
    return USER_SETTINGS_CONFIG[key]?.description ?? ''
  }

  getMyDesignTags(): IMyDesignTag[] {
    return MYDESIGN_TAGS
  }

  getDefaultMyDesignFiles(): { [key: string]: IMyDesign[] } {
    const res = {} as { [key: string]: IMyDesign[] }
    for (const tag of MYDESIGN_TAGS) {
      res[tag.tab] = []
    }
    return res
  }

  getDefaultMyDesignNextPages(): { [key: string]: number } {
    const res = {} as { [key: string]: number }
    for (const tag of MYDESIGN_TAGS) {
      res[tag.tab] = -1
    }
    return res
  }

  setDefaultLocale() {
    let locale = localStorage.getItem('locale')
    if (locale === '' || !locale) {
      locale = localeUtils.getBrowserLang()
    }
    this.STANDALONE_USER_INFO.locale = locale
  }

  setDefaultPrices() {
    const defaultPrices = {
      tw: {
        currency: 'TWD',
        monthly: {
          value: 140,
          text: '140元'
        },
        annually: {
          value: 799,
          text: '799元'
        }
      },
      us: {
        currency: 'USD',
        monthly: {
          value: 4.99,
          text: '$4.99'
        },
        annually: {
          value: 26.90,
          text: '$26.90'
        }
      },
      jp: {
        currency: 'JPY',
        monthly: {
          value: 600,
          text: '¥600円(税込)'
        },
        annually: {
          value: 3590,
          text: '¥3590円(税込)'
        }
      }
    } as { [key: string]: IPrices }
    store.commit('vivisticker/UPDATE_payment', { prices: defaultPrices[this.STANDALONE_USER_INFO.locale] ?? defaultPrices.us })
    store.commit('vivisticker/SET_paymentPending', { info: false })
  }

  addDesignDisabled() {
    return this.everEntersDebugMode || window.location.hostname !== 'sticker.vivipic.com'
  }

  setCurrActiveTab(tab: string) {
    store.commit('vivisticker/SET_currActiveTab', tab)
  }

  filterLog(messageType: string, message: any) {
    switch (messageType) {
      case 'SET_STATE':
        return message.key === 'tempDesign'
    }
    return false
  }

  sendToIOS(messageType: string, message: any) {
    if (messageType === 'SCREENSHOT' && message.action !== 'editorCopy') {
      this.handleIos16Video()
    }
    super.sendToIOS(messageType, message)
  }

  appToast(msg: string) {
    this.sendToIOS('SHOW_TOAST', { msg })
  }

  sendDoneLoading(width: number, height: number, options: string, needCrop = false) {
    this.sendToIOS('DONE_LOADING', { width, height, options, needCrop })
  }

  sendScreenshotUrl(query: string, action = 'copy') {
    this.sendToIOS('SCREENSHOT', { params: query, action })
    if (this.isStandaloneMode) {
      const url = `${window.location.origin}/screenshot/?${query}`
      window.open(url, '_blank')
    }
  }

  sendAppLoaded() {
    if (!this.appLoadedSent) {
      this.sendToIOS('APP_LOADED', { hideReviewRequest: false })
      this.appLoadedSent = true
    }
  }

  createUrl(item: IAsset): string {
    switch (item.type) {
      case 5:
      case 11:
      case 10:
        return `type=svg&id=${item.id}&ver=${item.ver}`
      case 14:
        return `type=svgImage2&id=${item.id}&ver=${item.ver}`
      case 15:
        return `type=svgImage&id=${item.id}&ver=${item.ver}&width=${item.width}&height=${item.height}`
      case 7:
        return `type=text&id=${item.id}&ver=${item.ver}`
      case 1:
        return `type=background&id=${item.id}&ver=${item.ver}`
      default:
        return ''
    }
  }

  createUrlForJSON(page?: IPage, asset?: IMyDesign): string {
    page = page ?? pageUtils.getPage(0)
    // since in iOS this value is put in '' enclosed string, ' needs to be escaped.
    const res = `type=json&id=${encodeURIComponent(JSON.stringify(uploadUtils.getSinglePageJson(page))).replace(/'/g, '\\\'')}`
    if (asset) {
      const key = this.mapEditorType2MyDesignKey(asset.type)
      return res + `&thumbType=mydesign&designId=${asset.id}&key=${key}`
    } else {
      return res
    }
  }

  setIsInCategory(tab: string, bool: boolean) {
    store.commit('vivisticker/SET_isInCategory', { tab, bool })
  }

  setShowAllRecently(tab: string, bool: boolean) {
    store.commit('vivisticker/SET_showAllRecently', { tab, bool })
  }

  getAssetInitiator(asset: IAsset, ...args: any[]): () => Promise<any> {
    return async () => {
      if (asset.type === 15) {
        await assetUtils.addAsset(asset, ...args)
        return true
      } else {
        return await assetUtils.addAsset(asset, ...args)
      }
    }
  }

  getFetchDesignInitiator(initiator: () => void): () => Promise<any> {
    return async () => {
      initiator()
      return true
    }
  }

  getAssetCallback(asset: IAsset): (jsonData: any) => void {
    return (jsonData: any) => {
      if ([5, 11, 10].includes(asset.type)) {
        if (jsonData.color && jsonData.color.length > 0) {
          colorUtils.setCurrEvent(ColorEventType.shape)
          eventUtils.emit(PanelEvent.switchTab, 'color')
        } else {
          eventUtils.emit(PanelEvent.switchTab, 'opacity')
        }
      }
      if (asset.type === 7) {
        textPropUtils.updateTextPropsState()
      }
    }
  }

  getFetchDesignCallback(callback: () => void): (jsonData: any) => void {
    return (jsonData: any) => {
      callback()
    }
  }

  getEmptyCallback(): (jsonData: any) => void {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return (jsonData: any) => { }
  }

  startEditing(editorType: string, assetInfo: { [key: string]: any }, initiator: () => Promise<any>, callback: (jsonData: any) => void, designId?: string) {
    const elTop = document.getElementsByClassName('vivisticker__top')[0]
    const headerHeight = 44
    const shortEdge = Math.min(elTop.clientWidth, elTop.clientHeight - headerHeight)
    const pageSize = Math.round(shortEdge * 0.9)
    pageUtils.setPages([pageUtils.newPage({
      width: pageSize,
      height: pageSize,
      backgroundColor: '#F8F8F8',
      isAutoResizeNeeded: true
    })])
    store.commit('vivisticker/SET_editingDesignId', designId ?? '')
    store.commit('vivisticker/SET_editingAssetInfo', assetInfo)
    initiator().then((jsonData?: any) => {
      if (jsonData) {
        stepsUtils.reset()
        store.commit('vivisticker/SET_editorType', editorType)
        this.saveDesign()
        callback(jsonData)
      }
    })
  }

  endEditing() {
    groupUtils.deselect()
    pageUtils.setPages()
    this.showController()
    this.setState('tempDesign', { design: 'none' })
    store.commit('vivisticker/SET_editorType', 'none')
  }

  initLoadingFlags(page: IPage | { layers: ILayer[] }, callback?: () => void) {
    this.loadingFlags = {}
    this.loadingCallback = callback
    for (const [index, layer] of page.layers.entries()) {
      this.initLoadingFlagsForLayer(layer, index)
    }
  }

  makeFlagKey(layerIndex: number, subLayerIndex = -1, clipIndex?: number) {
    return subLayerIndex === -1 ? `i${layerIndex}` : (`i${layerIndex}_s${subLayerIndex}` + (typeof clipIndex !== 'undefined' ? `_c${clipIndex}` : ''))
  }

  initLoadingFlagsForLayer(layer: ILayer, layerIndex: number, subLayerIndex = -1, clipIndex?: number) {
    switch (layer.type) {
      case LayerType.group:
        for (const [subIndex, subLayer] of (layer as IGroup).layers.entries()) {
          this.initLoadingFlagsForLayer(subLayer, layerIndex, subIndex)
          // this.initLoadingFlagsForLayer(subLayer, layerIndex, subIndex, clipIndex)
        }
        break
      case LayerType.frame: {
        this.loadingFlags[this.makeFlagKey(layerIndex, subLayerIndex)] = false
        const frame = layer as IFrame
        const layers = [...frame.clips] as Array<IImage | IShape>
        if (frame.decoration) {
          layers.unshift(frame.decoration)
        }
        if (frame.decorationTop) {
          layers.push(frame.decorationTop)
        }
        if (subLayerIndex === -1) {
          for (const [_clipIndex, subLayer] of layers.entries()) {
            this.initLoadingFlagsForLayer(subLayer, layerIndex, _clipIndex)
          }
        } else {
          for (const [_clipIndex, subLayer] of layers.entries()) {
            this.initLoadingFlagsForLayer(subLayer, layerIndex, subLayerIndex, _clipIndex)
          }
        }
      }
        break
      default:
        this.loadingFlags[this.makeFlagKey(layerIndex, subLayerIndex, clipIndex)] = false
    }
  }

  initLoadingFlagsForOneLayer(callback?: () => void) {
    this.loadingFlags = {}
    this.loadingCallback = callback
    this.loadingFlags[this.makeFlagKey(0, -1)] = false
  }

  setLoadingFlag(layerIndex: number, subLayerIndex = -1, clipIndex?: number) {
    const key = this.makeFlagKey(layerIndex, subLayerIndex, clipIndex)
    if (Object.prototype.hasOwnProperty.call(this.loadingFlags, key)) {
      this.loadingFlags[key] = true
    }
    if (Object.values(this.loadingFlags).length !== 0 && !Object.values(this.loadingFlags).some(f => !f) && this.loadingCallback) {
      this.loadingCallback()
      this.loadingFlags = {}
      this.loadingCallback = undefined
    }
  }

  hideController() {
    store.commit('vivisticker/SET_controllerHidden', true)
  }

  showController() {
    store.commit('vivisticker/SET_controllerHidden', false)
  }

  enterStandaloneMode() {
    store.commit('vivisticker/SET_isStandaloneMode', true)
  }

  deselect() {
    if (this.editorTypeTextLike) {
      groupUtils.deselect()
      editorUtils.setInMultiSelectionMode(false)
      store.commit('SET_currActivePageIndex', 0)
      if (imageUtils.isImgControl()) {
        imageUtils.setImgControlDefault(false)
      }
    } else {
      const { getCurrLayer: currLayer, pageIndex, layerIndex, subLayerIdx } = layerUtils
      switch (currLayer.type) {
        case 'text':
          layerUtils.updateLayerProps(pageIndex, layerIndex, { contentEditable: false })
          break
        case 'group':
        case 'tmp':
          if (subLayerIdx !== -1) {
            const subLayer = (currLayer as IGroup).layers[subLayerIdx]
            const updateData = { active: false } as { [key: string]: string | boolean }
            if (subLayer.type === 'text') {
              updateData.contentEditable = false
            }
            layerUtils.updateLayerProps(pageIndex, layerIndex, updateData, subLayerIdx)
          }
          break
        case 'frame':
          if (subLayerIdx !== -1) {
            frameUtils.updateFrameLayerProps(pageIndex, layerIndex, subLayerIdx, { active: false })
          }
      }
      if (imageUtils.isImgControl()) {
        imageUtils.setImgControlDefault(false)
      }
      this.hideController()
    }
  }

  copyEditor(callback?: (flag: string) => void) {
    const executor = () => {
      nextTick(() => {
        this.preCopyEditor()
        nextTick(() => {
          setTimeout(() => {
            this.sendCopyEditor().then((flag) => {
              this.postCopyEditor()
              callback && callback(flag)
            })
          }, 500) // wait for soft keyboard to close
        }) // wait for HeaderTabs to update height
      })
    }
    if (store.getters['text/getIsFontLoading']) {
      this.sendToIOS('SHOW_LOADING', this.getEmptyMessage())
      textUtils.untilFontLoadedForPage(pageUtils.getPage(0)).then(() => {
        setTimeout(executor, 200) // in case the render slightly delays after font loading
      })
    } else {
      executor()
    }
  }

  preCopyEditor(toResize = true) {
    if (toResize) {
      this.handleTextResize()
    }
    this.editorStateBuffer.controllerHidden = this.controllerHidden
    this.hideController()
    store.commit('vivisticker/SET_isDuringCopy', true)
  }

  postCopyEditor() {
    if (!this.editorStateBuffer.controllerHidden) {
      this.showController()
    }
    this.handleTextUnresize()
    store.commit('vivisticker/SET_isDuringCopy', false)
    this.editorStateBuffer = {}
  }

  handleTextResize() {
    const editorType = this.editorType
    if (editorType === 'text') {
      const page = pageUtils.getPage(0)
      const layers = page.layers
      if (layers.length !== 1 || layers[0].type !== 'text') return
      const textLayer = layers[0] as IText
      const styles = textLayer.styles
      if (styles.textBg.name !== 'none' || styles.textEffect.name !== 'none' || styles.width >= page.width / 2) return
      this.editorStateBuffer.scale = styles.scale
      this.editorStateBuffer.x = styles.x
      this.editorStateBuffer.y = styles.y
      this.editorStateBuffer.width = styles.width
      this.editorStateBuffer.height = styles.height
      this.editorStateBuffer.widthLimit = textLayer.widthLimit
      const ratio = Math.min(page.width / 2 / styles.width, page.height / styles.height)
      const scale = styles.scale * ratio
      const x = (page.width - styles.width * ratio) / 2
      const y = (page.height - styles.height * ratio) / 2
      layerUtils.updateLayerStyles(0, 0, { scale, x, y, width: styles.width * ratio, height: styles.height * ratio })
      layerUtils.updateLayerProps(0, 0, { widthLimit: textLayer.widthLimit * ratio })
    }
  }

  handleTextUnresize() {
    const { scale, x, y, width, height, widthLimit } = this.editorStateBuffer
    if (scale !== undefined && x !== undefined && y !== undefined && width !== undefined && height !== undefined && widthLimit !== undefined) {
      layerUtils.updateLayerStyles(0, 0, { scale, x, y, width, height })
      layerUtils.updateLayerProps(0, 0, { widthLimit })
    }
  }

  setHasNewBgColor(hasNewBgColor: boolean) {
    store.commit('vivisticker/SET_hasNewBgColor', hasNewBgColor)
  }

  commitNewBgColor() {
    const hasNewBgColor = store.getters['vivisticker/getHasNewBgColor']
    const newBgColor = store.getters['color/currColor']
    if (!hasNewBgColor || newBgColor === '') return
    this.addAsset('backgroundColor', { id: newBgColor.replace('#', '') })
    store.commit('vivisticker/UPDATE_addRecentlyBgColor', newBgColor)
  }

  async getUserInfo(): Promise<IUserInfo> {
    if (this.isStandaloneMode) return this.getUserInfoFromStore()
    await this.callIOSAsAPI('LOGIN', this.getEmptyMessage(), 'login')
    const userInfo = this.getUserInfoFromStore()
    const appCaps = await fetch(`https://template.vivipic.com/static/appCaps_sticker.json?ver=${generalUtils.generateRandomString(6)}`)
    const jsonCaps = await appCaps.json() as { review_ver: string }
    store.commit('webView/SET_inReviewMode', jsonCaps.review_ver === userInfo.appVer)
    return userInfo
  }

  loginResult(info: Omit<IUserInfo, 'modelName'> & { modelName?: string }) {
    // input info may not contain modelName
    if (info.modelName === undefined) { // if modelName isn't included, set '' as default
      info.modelName = ''
    }
    // after previous handle, info is assured to have modelName
    store.commit('vivisticker/SET_userInfo', info as IUserInfo)
    this.handleCallback('login')
  }

  async updateLocale(locale: string): Promise<void> {
    if (this.isStandaloneMode) {
      localStorage.setItem('locale', locale)
      return
    }
    await this.callIOSAsAPI('UPDATE_USER_INFO', { locale }, 'update-user-info')
  }

  updateInfoDone(data: { flag: string, msg?: string }) {
    if (data.flag !== '0') {
      this.errorMessageMap.locale = data.msg ?? ''
    }
    this.handleCallback('update-user-info')
  }

  async listAsset(key: string): Promise<void> {
    if (this.isStandaloneMode) return
    await this.callIOSAsAPI('LIST_ASSET', { key }, `list-asset-${key}`)
  }

  async listMoreAsset(key: string, nextPage: number): Promise<void> {
    if (this.isStandaloneMode) return
    if (nextPage < 0) return
    await this.callIOSAsAPI('LIST_ASSET', { key, pageIndex: nextPage }, `list-asset-${key}`)
  }

  listAssetResult(data: { key: string, assets: any[], nextPage: string }) {
    if (data.key.startsWith('mydesign')) {
      this.processMydesignList(data.key, data.assets)
      this.handleCallback(`list-asset-${data.key}`)
      store.commit('vivisticker/SET_myDesignNextPage', {
        tab: this.myDesignKey2Tab(data.key),
        nextPage: parseInt(data.nextPage)
      })
      return
    }
    if (['color', 'backgroundColor', 'giphy'].includes(data.key)) {
      assetUtils.setRecentlyUsed(data.key, data.assets)
      this.handleCallback(`list-asset-${data.key}`)
      return
    }
    const designIds = data.assets.map(asset => asset.id)
    listApis.getInfoList(MODULE_TYPE_MAPPING[data.key], designIds).then((response) => {
      if (response.data.data.content.length !== 0) {
        const updateList = response.data.data.content[0].list
        data.assets = this.updateAssetContent(data.assets, updateList)
        assetUtils.setRecentlyUsed(data.key, data.assets)
      }
      this.handleCallback(`list-asset-${data.key}`)
    })
  }

  myDesignKey2Tab(key: string): string {
    return key.split('-').slice(1).join('-')
  }

  processMydesignList(key: string, assets: any[]) {
    const type = this.myDesignKey2Tab(key)
    store.commit('vivisticker/SET_myDesignFileList', {
      tab: type,
      list: assets.map(asset => Object.assign(asset, { ver: generalUtils.generateRandomString(12) }))
    })
  }

  updateAssetContent(targetList: any[], updateList: IListServiceContentDataItem[]): any[] {
    let targetIndex = 0
    let updateIndex = 0
    const resList = []
    while (updateIndex < updateList.length) {
      const targetItem = targetList[targetIndex]
      const updateItem = updateList[updateIndex]
      if (targetItem.id === updateItem.id) {
        if (updateItem.valid === 1 || updateItem.valid === undefined) {
          delete updateItem.valid
          resList.push(Object.assign(targetItem, updateItem))
        }
        targetIndex++
        updateIndex++
      } else {
        targetIndex++
        if (targetIndex === targetList.length) {
          targetIndex = 0
          updateIndex++
        }
      }
    }
    return resList
  }

  async addAsset(key: string, asset: any, limit = 100, files: { [key: string]: any } = {}) {
    if (this.isStandaloneMode) return
    if (this.checkVersion('1.9')) {
      await this.callIOSAsAPI('ADD_ASSET', { key, asset, limit, files }, 'addAsset')
    } else {
      this.sendToIOS('ADD_ASSET', { key, asset })
    }
  }

  addAssetDone() {
    this.handleCallback('addAsset')
  }

  async setState(key: string, value: any) {
    if (this.isStandaloneMode) return
    if (this.checkVersion('1.9')) {
      await this.callIOSAsAPI('SET_STATE', { key, value }, 'setState')
    } else {
      this.sendToIOS('SET_STATE', { key, value })
    }
  }

  setStateDone() {
    this.handleCallback('setState')
  }

  async getState(key: string): Promise<WEBVIEW_API_RESULT> {
    if (this.isStandaloneMode) return
    return await this.callIOSAsAPI('GET_STATE', { key }, `getState-${key}`, { retry: true })
  }

  getStateResult(data: { key: string, value: string }) {
    this.handleCallback(`getState-${data.key}`, data.value ? JSON.parse(data.value) : undefined)
  }

  async sendCopyEditor(): Promise<string> {
    if (this.isStandaloneMode) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return '0'
    }
    const { x, y, width, height } = this.getEditorDimensions()
    const data = await this.callIOSAsAPI('SCREENSHOT', {
      params: '',
      action: 'editorCopy',
      width,
      height,
      x,
      y,
      bgColor: store.getters['vivisticker/getEditorBg'] // for older app
    }, 'copy-editor', { timeout: -1 })
    return (data?.flag as string) ?? '0'
  }

  copyDone(data: { flag: string }) {
    this.handleCallback('copy-editor', data)
  }

  saveDesign(pages_?: IPage[]) {
    if (this.isStandaloneMode) return
    const useArgPages = pages_ !== undefined
    const pages = useArgPages ? pages_ : pageUtils.getPages
    const editorType = store.getters['vivisticker/getEditorType']
    const editingDesignId = store.getters['vivisticker/getEditingDesignId']
    const assetInfo = store.getters['vivisticker/getEditingAssetInfo']
    const design = {
      pages: uploadUtils.prepareJsonToUpload(pages, useArgPages),
      editorType,
      id: editingDesignId,
      assetInfo
    } as ITempDesign
    this.setState('tempDesign', { design: JSON.stringify(design) })
  }

  async fetchDesign(): Promise<ITempDesign | undefined> {
    const designData = (await this.getState('tempDesign')) as { design: string } | undefined
    const designString = designData?.design
    let design
    if (designString && designString !== 'none') {
      design = JSON.parse(designString) as ITempDesign
      design.pages = pageUtils.newPages(design.pages)
    } else {
      design = undefined
    }
    return design
  }

  initWithTempDesign(tempDesign: ITempDesign) {
    const {
      pages,
      editorType,
      id,
      assetInfo
    } = tempDesign
    this.startEditing(editorType, assetInfo ?? {}, this.getFetchDesignInitiator(() => {
      this.setPages(pages)
    }), () => {
      if (editorType === 'object') {
        groupUtils.select(0, [0])
      }
    }, id ?? '')
  }

  async fetchMyDesign(myDesign: IMyDesign) {
    const { id, type } = myDesign
    const data = await this.getAsset(`mydesign-${this.mapEditorType2MyDesignKey(type)}`, id, 'config')
    data.pages = pageUtils.newPages(data.pages)
    return data
  }

  initWithMyDesign(myDesign: IMyDesign, option?: { callback?: (pages: Array<IPage>) => void, tab?: string }) {
    const { callback, tab = 'opacity' } = option || {}
    const {
      id,
      type,
      assetInfo
    } = myDesign
    this.fetchMyDesign(myDesign).then((data) => {
      const pages = data.pages
      this.startEditing(type, assetInfo ?? {}, this.getFetchDesignInitiator(() => {
        if (callback) {
          callback(pages)
        }
        this.setPages(pages)
      }), () => {
        if (type === 'object') {
          groupUtils.select(0, [0])
          const firstObject = (pages[0] as IPage).layers[0]
          if (firstObject.type === 'shape' && ((firstObject as IShape).color?.length ?? 0) > 0) {
            eventUtils.emit(PanelEvent.switchTab, 'color', { currColorEvent: ColorEventType.shape })
            // not shows the tab only as the frame got one clip
          } else if (firstObject.type !== 'frame' || (firstObject as IFrame).clips.length > 1) {
            tab && eventUtils.emit(PanelEvent.switchTab, tab)
          }
        }
      }, id ?? '')
    })
  }

  async saveAsMyDesign(): Promise<void> {
    const editingDesignId = store.getters['vivisticker/getEditingDesignId']
    const id = editingDesignId !== '' ? editingDesignId : generalUtils.generateAssetId()
    const flag = await this.genThumbnail(id)
    if (flag === '1') return
    await this.saveDesignJson(id)
  }

  setPages(pages: IPage[]) {
    layerUtils.setAutoResizeNeededForLayersInPages(pages, true)
    store.commit('SET_pages', pages)
  }

  async genThumbnail(id: string): Promise<string> {
    if (this.isStandaloneMode) return '0'
    return await new Promise<string>((resolve, reject) => {
      try {
        nextTick(() => {
          this.preCopyEditor(false)
          setTimeout(() => {
            const { x, y, width, height } = this.getEditorDimensions()
            const editorType = store.getters['vivisticker/getEditorType']
            this.callIOSAsAPI('GEN_THUMB', {
              type: 'mydesign',
              id,
              width,
              height,
              x,
              y,
              needCrop: editorType === 'text' ? 0 : 1,
              bgColor: store.getters['vivisticker/getEditorBg'] // for older app
            }, 'gen-thumb', { timeout: -1 }).then((data) => {
              this.postCopyEditor()
              resolve(data?.flag ?? '0')
            })
          }, 500) // wait for soft keyboard to close
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  thumbDone(data: { flag: string }) {
    this.handleCallback('gen-thumb', data)
  }

  async deleteAsset(key: string, id: string, thumbType: string): Promise<void> {
    this.designDeletionQueue.push({ key, id, thumbType })
    if (this.designDeletionQueue.length === 1) {
      this.processDeleteAsset()
    }
  }

  async processDeleteAsset() {
    const deletion = this.designDeletionQueue[0]
    if (deletion) {
      const { key, id, thumbType } = deletion
      await this.callIOSAsAPI('DELETE_ASSET', { key, id, thumbType }, 'delete-asset')
      store.commit('vivisticker/UPDATE_deleteDesign', { tab: this.myDesignKey2Tab(key), id })
      this.designDeletionQueue.shift()
      this.processDeleteAsset()
    }
  }

  deleteAssetDone() {
    this.handleCallback('delete-asset')
  }

  async saveDesignJson(id: string): Promise<IMyDesign | undefined> {
    if (this.isStandaloneMode) return
    const pages = pageUtils.getPages
    const editorType = store.getters['vivisticker/getEditorType']
    const assetInfo = store.getters['vivisticker/getEditingAssetInfo']
    const json = {
      type: editorType,
      id,
      updateTime: new Date(Date.now()).toISOString(),
      assetInfo
    } as IMyDesign
    await this.addAsset(`mydesign-${this.mapEditorType2MyDesignKey(editorType)}`, json, 0, {
      config: { pages: uploadUtils.prepareJsonToUpload(pages) }
    })
    return json
  }

  async getAsset(key: string, id: string, name: string): Promise<any> {
    return await this.callIOSAsAPI('GET_ASSET', { key, id, name }, 'get-asset')
  }

  getAssetResult(data: { key: string, id: string, json: any }) {
    this.handleCallback('get-asset', data.json)
  }

  getEditorDimensions(): { x: number, y: number, width: number, height: number } {
    const { width: pageWidth, height: pageHeight } = pageUtils.getPageSize(0)
    const editorEle = document.querySelector('#vvstk-editor') as HTMLElement
    const defaultDimensions = {
      x: 16,
      y: 60,
      width: pageWidth,
      height: pageHeight
    }
    if (!editorEle) {
      return defaultDimensions
    }
    let { width, height, x, y } = editorEle.getBoundingClientRect()
    if (width <= 0) {
      width = defaultDimensions.width
    }
    if (height <= 0) {
      height = defaultDimensions.height
    }
    if (x <= 0) { // left-padding of editor view
      x = defaultDimensions.x
    }
    if (y <= 0) { // top-padding of editor view + height of headerTabs
      y = defaultDimensions.y
    }
    return { x, y, width, height }
  }

  getContrastColor(editorBg: string) {
    return editorBg === '#F4F5F7' ? '#000000' : '#FFFFFF'
  }

  getThumbSrc(type: string, id: string, ver: string) {
    return `vvstk://${type}/${id}?ver=${ver}`
  }

  async getIosImg(limit = 1): Promise<Array<string>> {
    const { images } = await this.callIOSAsAPI('UPLOAD_IMAGE', { limit }, 'upload-image', { timeout: 60000 }) as IIosImgData
    return images
  }

  uploadImageURL(data: any) {
    this.handleCallback('upload-image', data)
  }

  updateFileDone() {
    this.handleCallback('update-file')
  }

  informWebResult(data: { info: any }) {
    const { info } = data
    const { event } = info
    switch (event) {
      case 'missing-image':
        this.handleMissingImage(info)
        break
    }
  }

  handleMissingImage(info: { key: string, id: string, thumbType: string }) {
    switch (info.thumbType) {
      case 'mydesign': {
        // eslint-disable-next-line no-case-declarations
        const designs = store.getters['vivisticker/getMyDesignFileList'](info.key) as IMyDesign[]
        // eslint-disable-next-line no-case-declarations
        const design = designs.find(d => d.id === info.id)
        if (!design) break
        // handle Dialog and File-selector
        this.initWithMyDesign(design, {
          callback: (pages: Array<IPage>) => {
            const page = pages[0]
            this.initLoadingFlags(page, () => {
              this.handleFrameClipError(page)
            })
          },
          tab: ''
        })
      }
    }
  }

  handleFrameClipError(page: IPage, showCheckContent = false) {
    const { layers } = page
    const frames = (layers
      .filter((l: ILayer) => l.type === 'frame') as Array<IFrame>)
    //   .flatMap((l: ILayer) => {
    //     if (l.type === 'frame') {
    //       return [l]
    //     } else if (l.type === 'group') {
    //       const frames = (l as any).layers
    //         .filter((l: ILayer) => l.type === 'frame') as Array<IFrame>
    //       return frames
    //     }
    //     return []
    //   }) as Array<IFrame>)
    // console.log('init loading flag', frames)
    const missingClips = frames
      .flatMap((f: IFrame) => f.clips.filter(c => c.srcObj.type === 'frame'))
    console.log('missingClips.length', missingClips.length)
    if (missingClips.length) {
      const action = missingClips.length !== 1 ? undefined : () => {
        let subLayerIdx = -1
        let layerIndex = -1
        const frame = layers
          .find((l, i) => {
            if (l.type === LayerType.frame && (l as IFrame).clips.some((c, i) => {
              if (c.srcObj.type === 'frame') {
                subLayerIdx = i
                return true
              }
              return false
            })) {
              layerIndex = i
              return true
            }
            return false
          }) as IFrame
        frameUtils.iosPhotoSelect({
          pageIndex: 0,
          layerIndex,
          subLayerIdx
        }, frame.clips[subLayerIdx])
      }

      if (USER_SETTINGS_CONFIG.mydesignShowMissingPhotoAsk.val) {
        let options
        if (showCheckContent) {
          options = {
            checkboxText: i18n.global.t(`${USER_SETTINGS_CONFIG.mydesignShowMissingPhotoAsk.description}`) as string,
            checked: false,
            onCheckedChange: (val: boolean) => {
              USER_SETTINGS_CONFIG.mydesignShowMissingPhotoAsk.val = !val
            }
          }
        }
        const modalBtn = {
          msg: i18n.global.t('STK0023') as string,
          action
        }
        modalUtils.setModalInfo(i18n.global.t('STK0024') as string, i18n.global.t('STK0022') as string, modalBtn, undefined, options)
      } else {
        action && action()
      }
    }
  }

  checkForEmptyFrame(pages: IPage[]) {
    for (const page of pages) {
      for (const layer of page.layers) {
        switch (layer.type) {
          case 'frame':
            if ((layer as IFrame).clips.some(c => c.srcObj.type === 'frame')) {
              return true
            }
            break
          case 'group':
          case 'tmp':
            for (const subLayer of (layer as IGroup).layers) {
              if (subLayer.type === 'frame' && (subLayer as any as IFrame).clips.some(c => c.srcObj.type === 'frame')) {
                return true
              }
            }
        }
      }
    }
    return false
  }

  mapEditorType2MyDesignKey(editorType: string): string {
    if (editorType === 'objectGroup') {
      return 'object'
    } else {
      return editorType
    }
  }

  async fetchDebugModeEntrance() {
    this.everEntersDebugMode = (await this.getState('everEntersDebugMode'))?.value ?? false
    if (!this.everEntersDebugMode && ((await this.getState('debugMode'))?.value ?? false)) {
      await this.recordDebugModeEntrance()
    }
  }

  async recordDebugModeEntrance() {
    this.everEntersDebugMode = true
    await this.setState('everEntersDebugMode', { value: this.everEntersDebugMode })
  }

  openPayment(target?: IViviStickerProFeatures) {
    if (this.isPaymentDisabled) {
      this.showUpdateModal()
      return
    }
    store.commit('vivisticker/SET_fullPageConfig', { type: 'payment', params: { target } })
  }

  checkPro(item: { plan?: number }, target?: IViviStickerProFeatures) {
    const isPro = store.getters['vivisticker/getIsSubscribed']
    if (item.plan === 1 && !isPro) {
      this.openPayment(target)
      return false
    }
    return true
  }

  subscribeInfo(data: ISubscribeInfo) {
    store.commit('vivisticker/SET_uuid', data.uuid)
    if (data.complete === '0') {
      this.registerSticker()
    }
    if (this.isPaymentDisabled) return
    const { subscribe, monthly, annually, priceCurrency } = data
    const currencyFormaters = {
      TWD: (value: string) => `${value}元`,
      USD: (value: string) => `$${(+value).toFixed(2)}`,
      JPY: (value: string) => `¥${value}円(税込)`
    } as { [key: string]: (value: string) => string }
    if (Object.keys(currencyFormaters).includes(priceCurrency)) {
      monthly.priceText = currencyFormaters[priceCurrency](monthly.priceValue)
      annually.priceText = currencyFormaters[priceCurrency](annually.priceValue)
    }

    store.commit('vivisticker/UPDATE_payment', {
      subscribe: subscribe === '1',
      prices: {
        currency: priceCurrency,
        monthly: {
          value: parseFloat(monthly.priceValue),
          text: monthly.priceText
        },
        annually: {
          value: parseFloat(annually.priceValue),
          text: annually.priceText
        }
      }
    })
    store.commit('vivisticker/SET_paymentPending', { info: false })
  }

  subscribeResult(data: ISubscribeResult) {
    if (!store.getters['vivisticker/getIsPaymentPending']) return // drop result if is timeout
    if (this.isPaymentDisabled) return
    if (data.reason) {
      store.commit('vivisticker/SET_paymentPending', { purchase: false, restore: false })
      return
    }
    const { subscribe, reason } = data
    if (!reason) {
      store.commit('vivisticker/UPDATE_payment', {
        subscribe: subscribe === '1',
      })
    }
    store.commit('vivisticker/SET_paymentPending', { purchase: false, restore: false })
    if (subscribe === '1') store.commit('vivisticker/SET_fullPageConfig', { type: 'welcome' })
  }

  async registerSticker() {
    const userInfo = this.getUserInfoFromStore()
    if (!isV1_26(userInfo)) return
    const response = await userApis.registerSticker(
      userInfo.hostId,
      store.getters['vivisticker/getUuid'],
      parseInt(userInfo.device),
      userInfo.country.toLocaleLowerCase(),
      1
    )
    if (response.data.flag === 0) {
      await this.setState('complete', { value: '1' })
      this.sendAdEvent('register', {})
    }
  }

  sendAdEvent(eventName: string, param: { [key: string]: any }) {
    this.sendToIOS('SEND_AD_EVENT', { eventName, param })
  }

  async fetchLoadedFonts(): Promise<void> {
    const loadedFonts = (await this.getState('loadedFonts')) ?? {}
    store.commit('vivisticker/SET_loadedFonts', loadedFonts)
  }

  async recordLoadedFont(face: string): Promise<void> {
    store.commit('vivisticker/UPDATE_addLoadedFont', face)
    const loadedFonts = store.getters['vivisticker/getLoadedFonts'] as { [key: string]: true }
    await this.setState('loadedFonts', { ...loadedFonts })
  }

  async checkFontLoaded(face: string): Promise<boolean> {
    const loadedFonts = store.getters['vivisticker/getLoadedFonts'] as { [key: string]: true }
    return loadedFonts[face] ?? false
  }

  handleIos16Video() {
    if (!this.hasCopied && this.checkOSVersion('16.0')) {
      this.hasCopied = true
      this.setState('hasCopied', { data: this.hasCopied })
      modalUtils.setModalInfo(i18n.global.t('STK0033').toString(), i18n.global.t('STK0034').toString(), {
        msg: i18n.global.t('STK0035').toString(),
        action: () => {
          store.commit('vivisticker/SET_fullPageConfig', {
            type: 'iOS16Video',
            params: { fromModal: true }
          })
          modalUtils.clearModalInfo()
        }
      }, undefined, {
        noClose: true,
        noCloseIcon: true
      })
    }
  }

  showUpdateModal() {
    let locale = this.getUserInfoFromStore().locale
    if (!['us', 'tw', 'jp'].includes(locale)) {
      locale = 'us'
    }
    const prefix = 'exp_' + locale + '_'
    const modalInfo = Object.fromEntries(Object.entries(store.getters['vivisticker/getModalInfo']).map(
      ([k, v]) => {
        if (k.startsWith(prefix)) k = k.replace(prefix, '')
        return [k, v as string]
      })
    )
    const options = {
      imgSrc: modalInfo.img_url,
      noClose: false,
      noCloseIcon: false,
      backdropStyle: {
        backgroundColor: 'rgba(24,25,31,0.3)'
      },
      cardStyle: {
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255,255,255,0.9)'
      }
    }
    modalUtils.setModalInfo(
      modalInfo.title,
      modalInfo.msg,
      {
        msg: modalInfo.btn_txt,
        class: 'btn-black-mid',
        style: {
          color: '#F8F8F8'
        },
        action: () => {
          const url = modalInfo.btn_url
          if (url) { window.open(url, '_blank') }
        }
      },
      {
        msg: modalInfo.btn2_txt || '',
        class: 'btn-light-mid',
        style: {
          border: 'none',
          color: '#474A57',
          backgroundColor: '#D3D3D3'
        }
      },
      options
    )
  }
}

export default new ViviStickerUtils()
