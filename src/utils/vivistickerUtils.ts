import { IAsset } from '@/interfaces/module'
import { IPage } from '@/interfaces/page'
import store from '@/store'
import Vue from 'vue'
import assetUtils from './assetUtils'
import groupUtils from './groupUtils'
import pageUtils from './pageUtils'
import stepsUtils from './stepsUtils'
import uploadUtils from './uploadUtils'
import eventUtils, { PanelEvent } from './eventUtils'
import { ColorEventType, LayerType } from '@/store/types'
import { IGroup, ILayer } from '@/interfaces/layer'
import editorUtils from './editorUtils'
import imageUtils from './imageUtils'
import layerUtils from './layerUtils'
import textPropUtils from './textPropUtils'
import { IMyDesign, IMyDesignTag, ITempDesign, IUserInfo, IUserSettings } from '@/interfaces/vivisticker'
import localeUtils from './localeUtils'
import listApis from '@/apis/list'
import { IListServiceContentDataItem } from '@/interfaces/api'
import textUtils from './textUtils'
import i18n from '@/i18n'
import generalUtils from './generalUtils'

const STANDALONE_USER_INFO: IUserInfo = {
  appVer: '1.3',
  locale: 'us',
  isFirstOpen: false,
  editorBg: ''
}

const USER_SETTINGS_CONFIG: {[key: string]: {default: any, description: string}} = {
  autoSave: {
    default: false,
    description: `${i18n.t('STK0012')}`
  }
}

const MODULE_TYPE_MAPPING: {[key: string]: string} = {
  objects: 'svg',
  textStock: 'text',
  background: 'background',
  font: 'font'
}

const ROUTER_CALLBACKS = [
  'loginResult',
  'getStateResult'
]

const VVSTK_CALLBACKS = [
  'updateInfoDone',
  'listAssetResult',
  'copyDone',
  'thumbDone',
  'setStateDone',
  'addAssetDone'
]

const MYDESIGN_TAGS = [{
  name: `${i18n.tc('NN0005', 2)}`,
  tab: 'text'
}, {
  name: `${i18n.tc('NN0003', 2)}`,
  tab: 'object'
}] as IMyDesignTag[]

class ViviStickerUtils {
  appLoadedSent = false
  loadingFlags = {} as { [key: string]: boolean }
  loadingCallback = undefined as (() => void) | undefined
  callbackMap = {} as {[key: string]: (data?: any) => void}
  errorMessageMap = {} as {[key: string]: string}
  editorStateBuffer = {} as {[key: string]: any}

  get editorType(): string {
    return store.getters['vivisticker/getEditorType']
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

  registerRouterCallbacks() {
    for (const callbackName of ROUTER_CALLBACKS) {
      (window as any)[callbackName] = (vivistickerUtils as any)[callbackName]
    }
  }

  registerVvstkCallbacks() {
    for (const callbackName of VVSTK_CALLBACKS) {
      (window as any)[callbackName] = (vivistickerUtils as any)[callbackName]
    }
  }

  getDefaultUserInfo(): IUserInfo {
    return STANDALONE_USER_INFO
  }

  getDefaultUserSettings(): IUserSettings {
    const res = {} as {[key: string]: any}
    for (const [key, value] of Object.entries(USER_SETTINGS_CONFIG)) {
      res[key] = value.default
    }
    return res as IUserSettings
  }

  getUserSettingDescription(key: string): string {
    return USER_SETTINGS_CONFIG[key]?.description ?? ''
  }

  getMyDesignTags(): IMyDesignTag[] {
    return MYDESIGN_TAGS
  }

  getDefaultMyDesignFiles(): {[key: string]: IMyDesign[]} {
    const res = {} as {[key: string]: IMyDesign[]}
    for (const tag of MYDESIGN_TAGS) {
      res[tag.tab] = []
    }
    return res
  }

  getEmptyMessage(): {[key: string]: string} {
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
    // console.log(messageType, message)
    try {
      const webkit = (window as any).webkit
      if (!webkit) {
        throw new Error('WebKit is not available!')
      }
      const messageHandler = webkit.messageHandlers[messageType]
      if (!messageHandler) {
        throw new Error(`message type: ${messageType} does not exist!`)
      }
      messageHandler.postMessage(message)
    } catch (error) {
      console.log(error)
    }
  }

  appToast(msg: string) {
    this.sendToIOS('SHOW_TOAST', { msg })
  }

  sendDoneLoading(width: number, height: number, options: string, needCrop = false) {
    console.log(width, height, options)
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
    console.log(item)
    switch (item.type) {
      case 5:
      case 11:
      case 10:
        return `type=svg&id=${item.id}&ver=${item.ver}`
      case 14:
        return `type=svgImage2&id=${item.id}&ver=${item.ver}`
      case 15:
        return `type=svgImage&id=${item.id}&ver=${item.ver}&width=${item.width}&height=${item.height}`
      case 1:
        return `type=background&id=${item.id}&ver=${item.ver}`
      default:
        return ''
    }
  }

  createUrlForJSON(): string {
    const page = pageUtils.getPage(0)
    // since in iOS this value is put in '' enclosed string, ' needs to be escaped.
    return `type=json&id=${encodeURIComponent(JSON.stringify(uploadUtils.getSinglePageJson(page))).replace(/'/g, '\\\'')}`
  }

  setIsInCategory(tab: string, bool: boolean) {
    store.commit('vivisticker/SET_isInCategory', { tab, bool })
  }

  setShowAllRecently(tab: string, bool: boolean) {
    store.commit('vivisticker/SET_showAllRecently', { tab, bool })
  }

  getAssetInitiator(asset: IAsset): () => Promise<any> {
    return async () => {
      // console.log('start editing', asset)
      if (asset.type === 15) {
        await assetUtils.addAsset(asset)
        return true
      } else {
        return await assetUtils.addAsset(asset)
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
          eventUtils.emit(PanelEvent.switchTab, 'color', { currColorEvent: ColorEventType.shape })
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
    return (jsonData: any) => {}
  }

  startEditing(editorType: string, initiator: () => Promise<any>, callback: (jsonData: any) => void, designId?: string) {
    const pageWidth = window.innerWidth - 32
    pageUtils.setPages([pageUtils.newPage({
      width: pageWidth,
      height: Math.round(pageWidth * 420 / 358),
      backgroundColor: '#F8F8F8',
      isAutoResizeNeeded: true
    })])
    store.commit('vivisticker/SET_editingDesignId', designId ?? '')
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

  setShowSaveDesignPopup(bool: boolean) {
    store.commit('vivisticker/SET_showSaveDesignPopup', bool)
  }

  initLoadingFlags(page: IPage, callback?: () => void) {
    this.loadingFlags = {}
    this.loadingCallback = callback
    for (const [index, layer] of page.layers.entries()) {
      this.initLoadingFlagsForLayer(layer, index)
    }
  }

  makeFlagKey(layerIndex: number, subLayerIndex = -1) {
    return subLayerIndex === -1 ? `i${layerIndex}` : `i${layerIndex}_s${subLayerIndex}`
  }

  initLoadingFlagsForLayer(layer: ILayer, layerIndex: number, subLayerIndex = -1) {
    switch (layer.type) {
      case LayerType.group:
        for (const [subIndex, subLayer] of (layer as IGroup).layers.entries()) {
          this.initLoadingFlagsForLayer(subLayer, layerIndex, subIndex)
        }
        break
      default:
        this.loadingFlags[this.makeFlagKey(layerIndex, subLayerIndex)] = false
    }
  }

  initLoadingFlagsForOneLayer(callback?: () => void) {
    this.loadingFlags = {}
    this.loadingCallback = callback
    this.loadingFlags[this.makeFlagKey(0, -1)] = false
  }

  setLoadingFlag(layerIndex: number, subLayerIndex = -1) {
    const key = this.makeFlagKey(layerIndex, subLayerIndex)
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
    if (this.editorType === 'text') {
      groupUtils.deselect()
      editorUtils.setInMultiSelectionMode(false)
      store.commit('SET_currActivePageIndex', 0)
      if (imageUtils.isImgControl()) {
        imageUtils.setImgControlDefault(false)
      }
    } else {
      const { getCurrLayer: currLayer, pageIndex, layerIndex, subLayerIdx } = layerUtils
      if (currLayer.type === 'text') {
        layerUtils.updateLayerProps(pageIndex, layerIndex, { contentEditable: false })
      } else if (['group', 'tmp'].includes(currLayer.type) && subLayerIdx !== -1) {
        const subLayer = (currLayer as IGroup).layers[subLayerIdx]
        if (subLayer.type === 'text') {
          layerUtils.updateLayerProps(pageIndex, layerIndex, { contentEditable: false }, subLayerIdx)
        }
      }
      if (imageUtils.isImgControl()) {
        imageUtils.setImgControlDefault(false)
      }
      this.hideController()
    }
  }

  checkVersion(targetVersion: string) {
    const [targetMain, targetSub] = targetVersion.split('.')
    const [currMain, currSub] = store.getters['vivisticker/getUserInfo'].appVer.split('.')
    return parseInt(currMain) > parseInt(targetMain) || (parseInt(currMain) === parseInt(targetMain) && parseInt(currSub) >= parseInt(targetSub))
  }

  copyEditor() {
    const executor = () => {
      Vue.nextTick(() => {
        this.preCopyEditor()
        setTimeout(() => {
          this.sendCopyEditor().then(() => {
            this.postCopyEditor()
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

  preCopyEditor() {
    this.editorStateBuffer = {
      controllerHidden: this.controllerHidden
    }
    this.hideController()
    store.commit('vivisticker/SET_isDuringCopy', true)
  }

  postCopyEditor() {
    if (!this.editorStateBuffer.controllerHidden) {
      this.showController()
    }
    store.commit('vivisticker/SET_isDuringCopy', false)
    this.editorStateBuffer = {}
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

  async callIOSAsAPI(type: string, message: any, event: string, timeout = 5000) {
    this.sendToIOS(type, message)
    const result = await Promise.race([
      new Promise<void>(resolve => {
        this.callbackMap[event] = resolve
      }),
      new Promise<void>(resolve => {
        setTimeout(() => {
          resolve()
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
    console.log(JSON.stringify(info))
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
      console.log(data.msg)
      this.errorMessageMap.locale = data.msg ?? ''
    }
    vivistickerUtils.handleCallback('update-user-info')
  }

  async listAsset(key: string): Promise<void> {
    if (this.isStandaloneMode) return
    await this.callIOSAsAPI('LIST_ASSET', { key }, `list-asset-${key}`)
  }

  listAssetResult(data: { key: string, assets: any[] }) {
    if (data.key.startsWith('mydesign')) {
      vivistickerUtils.processMydesignList(data.key, data.assets)
      vivistickerUtils.handleCallback(`list-asset-${data.key}`)
      return
    }
    if (['color', 'backgroundColor'].includes(data.key)) {
      assetUtils.setRecentlyUsed(data.key, data.assets)
      vivistickerUtils.handleCallback(`list-asset-${data.key}`)
      return
    }
    const designIds = data.assets.map(asset => asset.id)
    listApis.getInfoList(MODULE_TYPE_MAPPING[data.key], designIds).then((response) => {
      const updateList = response.data.data.content[0].list
      data.assets = vivistickerUtils.updateAssetContent(data.assets, updateList)
      assetUtils.setRecentlyUsed(data.key, data.assets)
      vivistickerUtils.handleCallback(`list-asset-${data.key}`)
    })
  }

  processMydesignList(key: string, assets: any[]) {
    const type = key.split('-').slice(1).join('-')
    store.commit('vivisticker/SET_myDesignFileList', {
      tab: type,
      list: assets
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

  async addAsset(key: string, asset: any) {
    if (this.isStandaloneMode) return
    if (this.checkVersion('1.9')) {
      await this.callIOSAsAPI('ADD_ASSET', { key, asset }, 'addAsset')
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
    return await vivistickerUtils.callIOSAsAPI('GET_STATE', { key }, 'getState')
  }

  getStateResult(data: { key: string, value: string }) {
    vivistickerUtils.handleCallback('getState', data.value ? JSON.parse(data.value) : undefined)
  }

  async sendCopyEditor(): Promise<void> {
    if (this.isStandaloneMode) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return
    }
    const editorEle = document.querySelector('#vvstk-editor') as HTMLElement
    const { width, height, x, y } = editorEle.getBoundingClientRect()
    await this.callIOSAsAPI('SCREENSHOT', {
      params: '',
      action: 'editorCopy',
      width,
      height,
      x,
      y,
      bgColor: store.getters['vivisticker/getEditorBg'] // for older app
    }, 'copy-editor')
  }

  copyDone() {
    vivistickerUtils.handleCallback('copy-editor')
  }

  saveDesign() {
    if (this.isStandaloneMode) return
    const pages = pageUtils.getPages
    const editorType = store.getters['vivisticker/getEditorType']
    const design = {
      pages: uploadUtils.prepareJsonToUpload(pages),
      editorType
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
      editorType
    } = tempDesign
    this.startEditing(editorType, this.getFetchDesignInitiator(() => {
      store.commit('SET_pages', pageUtils.newPages(pages))
    }), this.getEmptyCallback())
  }

  async saveAsMyDesign(): Promise<void> {
    const editingDesignId = store.getters['vivisticker/getEditingDesignId']
    const id = editingDesignId !== '' ? editingDesignId : generalUtils.generateAssetId()
    await Promise.all([
      this.genThumbnail(id),
      this.saveDesignJson(id)
    ])
  }

  async genThumbnail(id: string): Promise<void> {
    if (this.isStandaloneMode) return
    await new Promise<void>((resolve, reject) => {
      try {
        Vue.nextTick(() => {
          this.preCopyEditor()
          setTimeout(() => {
            const editorEle = document.querySelector('#vvstk-editor') as HTMLElement
            const { width, height, x, y } = editorEle.getBoundingClientRect()
            this.callIOSAsAPI('GEN_THUMB', {
              type: 'mydesign',
              id,
              width,
              height,
              x,
              y,
              bgColor: store.getters['vivisticker/getEditorBg'] // for older app
            }, 'gen-thumb').then(() => {
              this.postCopyEditor()
              resolve()
            })
          }, 500) // wait for soft keyboard to close
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  thumbDone() {
    vivistickerUtils.handleCallback('gen-thumb')
  }

  async saveDesignJson(id: string): Promise<void> {
    if (this.isStandaloneMode) return
    const pages = pageUtils.getPages
    const editorType = store.getters['vivisticker/getEditorType']
    const json = {
      pages: uploadUtils.prepareJsonToUpload(pages),
      type: editorType,
      id,
      updateTime: new Date(Date.now()).toISOString()
    } as IMyDesign
    await this.addAsset(`mydesign-${editorType}`, json)
  }

  getContrastColor(editorBg: string) {
    return editorBg === '#F4F5F7' ? '#000000' : '#FFFFFF'
  }

  getThumbSrc(type: string, id: string) {
    return `vvstk://${type}/${id}`
  }
}

const vivistickerUtils = new ViviStickerUtils()

export default vivistickerUtils
