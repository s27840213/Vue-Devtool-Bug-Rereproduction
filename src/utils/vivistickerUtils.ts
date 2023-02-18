import listApis from '@/apis/list'
import i18n from '@/i18n'
import { IListServiceContentDataItem } from '@/interfaces/api'
import { IFrame, IGroup, IImage, ILayer, IShape, IText } from '@/interfaces/layer'
import { IAsset } from '@/interfaces/module'
import { IPage } from '@/interfaces/page'
import { IIosImgData, IMyDesign, IMyDesignTag, ITempDesign, IUserInfo, IUserSettings } from '@/interfaces/vivisticker'
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
import logUtils from './logUtils'
import modalUtils from './modalUtils'
import pageUtils from './pageUtils'
import stepsUtils from './stepsUtils'
import textPropUtils from './textPropUtils'
import textUtils from './textUtils'
import uploadUtils from './uploadUtils'

const STANDALONE_USER_INFO: IUserInfo = {
  hostId: '',
  appVer: '100.0',
  locale: 'us',
  isFirstOpen: false,
  editorBg: '',
  osVer: '100.0'
}

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

const ROUTER_CALLBACKS = [
  'loginResult',
  'getStateResult',
  'setStateDone'
]

const VVSTK_CALLBACKS = [
  'updateInfoDone',
  'listAssetResult',
  'copyDone',
  'thumbDone',
  'addAssetDone',
  'deleteAssetDone',
  'getAssetResult',
  'uploadImageURL',
  'informWebResult'
]

const SCREENSHOT_CALLBACKS = [
  'thumbDone',
  'updateFileDone',
  'informWebResult'
]

const CALLBACK_MAPS = {
  router: ROUTER_CALLBACKS,
  vvstk: VVSTK_CALLBACKS,
  screenshot: SCREENSHOT_CALLBACKS
}

const MYDESIGN_TAGS = [{
  name: 'NN0005',
  tab: 'text'
}, {
  name: 'NN0003',
  tab: 'object'
}] as IMyDesignTag[]

const DOCUMENT_URLS = {
  jp: {
    privacyPolicy: 'https://blog.vivipic.com/jp/jp-privacy-policy/',
    termOfUse: 'https://blog.vivipic.com/jp/jp-terms-of-use/'
  },
  us: {
    privacyPolicy: 'https://blog.vivipic.com/us/us-privacy-policy/',
    termOfUse: 'https://blog.vivipic.com/us/us-terms-of-use/'
  },
  tw: {
    privacyPolicy: 'https://blog.vivipic.com/tw/tw-privacy-policy/ ',
    termOfUse: 'https://blog.vivipic.com/tw/tw-agreement/'
  }
} as { [key: string]: { [key: string]: string } }

class ViviStickerUtils {
  appLoadedSent = false
  isAnyIOSImgOnError = false
  hasCopied = false
  loadingFlags = {} as { [key: string]: boolean }
  loadingCallback = undefined as (() => void) | undefined
  callbackMap = {} as { [key: string]: (data?: any) => void }
  errorMessageMap = {} as { [key: string]: string }
  editorStateBuffer = {} as { [key: string]: any }
  designDeletionQueue = [] as { key: string, id: string, thumbType: string }[]

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

  registerCallbacks(type: 'router' | 'vvstk' | 'screenshot') {
    for (const callbackName of CALLBACK_MAPS[type]) {
      (window as any)[callbackName] = (vivistickerUtils as any)[callbackName]
    }
  }

  getDefaultUserInfo(): IUserInfo {
    return STANDALONE_USER_INFO
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

  getDocumentUrl(locale: string, key: string): string {
    return DOCUMENT_URLS[locale][key]
  }

  getEmptyMessage(): { [key: string]: string } {
    return { empty: '' }
  }

  setDefaultLocale() {
    let locale = localStorage.getItem('locale')
    if (locale === '' || !locale) {
      locale = localeUtils.getBrowserLang()
    }
    STANDALONE_USER_INFO.locale = locale
  }

  setCurrActiveTab(tab: string) {
    store.commit('vivisticker/SET_currActiveTab', tab)
  }

  sendToIOS(messageType: string, message: any) {
    logUtils.setLogAndConsoleLog(messageType, message)
    if (messageType === 'SCREENSHOT' && !this.hasCopied && this.checkOSVersion('16.0')) {
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
    try {
      const webkit = (window as any).webkit
      if (!webkit) return
      const messageHandler = webkit.messageHandlers[messageType]
      if (!messageHandler) {
        throw new Error(`message type: ${messageType} does not exist!`)
      }
      messageHandler.postMessage(generalUtils.unproxify(message))
    } catch (error) {
      logUtils.setLogAndConsoleLog(error)
    }
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
    logUtils.setLogAndConsoleLog(item)
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
    const pageWidth = window.outerWidth - 32
    pageUtils.setPages([pageUtils.newPage({
      width: pageWidth,
      height: Math.round(pageWidth * 420 / 358),
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
    // console.warn(generalUtils.deepCopy(this.loadingFlags))
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

  checkVersion(targetVersion: string) {
    // targetVersion must be in format: <main>.<sub> e.g. 1.18
    const [targetMain, targetSub] = targetVersion.split('.')
    const [currMain, currSub] = store.getters['vivisticker/getUserInfo'].appVer.split('.')
    return parseInt(currMain) > parseInt(targetMain) || (parseInt(currMain) === parseInt(targetMain) && parseInt(currSub) >= parseInt(targetSub))
  }

  checkOSVersion(targetVersion: string) {
    // targetVersion must be in format: <main>.<sub> e.g. 1.18
    const [targetMain, targetSub] = targetVersion.split('.')
    const [currMain, currSubRaw] = (store.getters['vivisticker/getUserInfo'].osVer ?? '0.0').split('.')
    const currSub = currSubRaw ?? '0'
    return parseInt(currMain) > parseInt(targetMain) || (parseInt(currMain) === parseInt(targetMain) && parseInt(currSub) >= parseInt(targetSub))
  }

  copyEditor(callback?: (flag: string) => void) {
    const executor = () => {
      nextTick(() => {
        this.preCopyEditor()
        setTimeout(() => {
          this.sendCopyEditor().then((flag) => {
            this.postCopyEditor()
            callback && callback(flag)
          })
        }, 500) // wait for soft keyboard to close
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

  setNewBgColor(color: string) {
    store.commit('vivisticker/SET_newBgColor', color)
  }

  commitNewBgColor() {
    const newBgColor = store.getters['vivisticker/getNewBgColor']
    if (newBgColor === '') return
    this.addAsset('backgroundColor', { id: newBgColor.replace('#', '') })
    store.commit('vivisticker/UPDATE_addRecentlyBgColor', newBgColor)
  }

  async callIOSAsAPI(type: string, message: any, event: string, timeout = 5000): Promise<any> {
    this.sendToIOS(type, message)
    const result = await Promise.race([
      new Promise<any>(resolve => {
        this.callbackMap[event] = resolve
      }),
      new Promise<undefined>(resolve => {
        setTimeout(() => {
          resolve(undefined)
        }, timeout)
      })
    ])
    delete this.callbackMap[event]
    return result
  }

  handleCallback(event: string, data?: any) {
    if (this.callbackMap[event]) {
      this.callbackMap[event](data)
    }
  }

  async getUserInfo(): Promise<IUserInfo> {
    if (this.isStandaloneMode) return store.getters['vivisticker/getUserInfo']
    await this.callIOSAsAPI('LOGIN', this.getEmptyMessage(), 'login')
    return store.getters['vivisticker/getUserInfo']
  }

  loginResult(info: IUserInfo) {
    logUtils.setLogAndConsoleLog(JSON.stringify(info))
    store.commit('vivisticker/SET_userInfo', info)
    vivistickerUtils.handleCallback('login')
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
      logUtils.setLogAndConsoleLog(data.msg)
      this.errorMessageMap.locale = data.msg ?? ''
    }
    vivistickerUtils.handleCallback('update-user-info')
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
      vivistickerUtils.processMydesignList(data.key, data.assets)
      vivistickerUtils.handleCallback(`list-asset-${data.key}`)
      store.commit('vivisticker/SET_myDesignNextPage', {
        tab: vivistickerUtils.myDesignKey2Tab(data.key),
        nextPage: parseInt(data.nextPage)
      })
      return
    }
    if (['color', 'backgroundColor', 'giphy'].includes(data.key)) {
      assetUtils.setRecentlyUsed(data.key, data.assets)
      vivistickerUtils.handleCallback(`list-asset-${data.key}`)
      return
    }
    const designIds = data.assets.map(asset => asset.id)
    listApis.getInfoList(MODULE_TYPE_MAPPING[data.key], designIds).then((response) => {
      if (response.data.data.content.length !== 0) {
        const updateList = response.data.data.content[0].list
        data.assets = vivistickerUtils.updateAssetContent(data.assets, updateList)
        assetUtils.setRecentlyUsed(data.key, data.assets)
      }
      vivistickerUtils.handleCallback(`list-asset-${data.key}`)
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
    vivistickerUtils.handleCallback('addAsset')
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
    vivistickerUtils.handleCallback('setState')
  }

  async getState(key: string): Promise<any> {
    if (this.isStandaloneMode) return
    return await vivistickerUtils.callIOSAsAPI('GET_STATE', { key }, 'getState')
  }

  getStateResult(data: { key: string, value: string }) {
    vivistickerUtils.handleCallback('getState', data.value ? JSON.parse(data.value) : undefined)
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
    }, 'copy-editor')
    return data?.flag ?? '0'
  }

  copyDone(data: { flag: string }) {
    vivistickerUtils.handleCallback('copy-editor', data)
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
    const designData = await this.getState('tempDesign')
    let design = designData?.design
    if (design && design !== 'none') {
      design = JSON.parse(design)
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
      store.commit('SET_pages', pageUtils.newPages(pages))
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
        store.commit('SET_pages', pages)
      }), () => {
        if (type === 'object') {
          groupUtils.select(0, [0])
          const firstObject = (pages[0] as IPage).layers[0]
          if (firstObject.type === 'shape' && ((firstObject as IShape).color?.length ?? 0) > 0) {
            eventUtils.emit(PanelEvent.switchTab, 'color', { currColorEvent: ColorEventType.shape })
          } else {
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
            }, 'gen-thumb').then((data) => {
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
    vivistickerUtils.handleCallback('gen-thumb', data)
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
    vivistickerUtils.handleCallback('delete-asset')
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
    vivistickerUtils.handleCallback('get-asset', data.json)
  }

  getEditorDimensions(): { x: number, y: number, width: number, height: number } {
    const editorEle = document.querySelector('#vvstk-editor') as HTMLElement
    const { width: pageWidth, height: pageHeight } = pageUtils.getPageSize(0)
    let { width, height, x, y } = editorEle.getBoundingClientRect()
    if (width <= 0) {
      width = pageWidth
    }
    if (height <= 0) {
      height = pageHeight
    }
    if (x <= 0) { // left-padding of editor view
      x = 16
    }
    if (y <= 0) { // top-padding of editor view + height of headerTabs
      y = 60
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
    const { images } = await this.callIOSAsAPI('UPLOAD_IMAGE', { limit }, 'upload-image', 60000) as IIosImgData
    return images
  }

  uploadImageURL(data: any) {
    vivistickerUtils.handleCallback('upload-image', data)
  }

  updateFileDone() {
    vivistickerUtils.handleCallback('update-file')
  }

  informWebResult(data: { info: any }) {
    const { info } = data
    const { event } = info
    switch (event) {
      case 'missing-image':
        vivistickerUtils.handleMissingImage(info)
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
            checkboxText: USER_SETTINGS_CONFIG.mydesignShowMissingPhotoAsk.description as string,
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
}

const vivistickerUtils = new ViviStickerUtils()

export default vivistickerUtils
