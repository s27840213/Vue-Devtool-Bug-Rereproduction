import listApis from '@/apis/list'
import userApis from '@/apis/user'
import i18n from '@/i18n'
import { IListServiceContentDataItem } from '@/interfaces/api'
import { CustomWindow } from '@/interfaces/customWindow'
import { IFrame, IGroup, IImage, ILayer, IShape, IText } from '@/interfaces/layer'
import { IAsset } from '@/interfaces/module'
import { IPage } from '@/interfaces/page'
import { IFullPageVideoConfigParams, IIosImgData, IMyDesign, IMyDesignTag, IPrices, ISubscribeInfo, ISubscribeResult, ISubscribeResultV1_45, ITempDesign, IUserInfo, IUserSettings, isCheckState, isGetProducts, isV1_26, isV1_42 } from '@/interfaces/vivisticker'
import { WEBVIEW_API_RESULT } from '@/interfaces/webView'
import store from '@/store'
import { ColorEventType, LayerType } from '@/store/types'
import constantData, { IStickerVideoUrls } from '@/utils/constantData'
import fileUtils from '@/utils/fileUtils'
import imageShadowUtils from '@/utils/imageShadowUtils'
import logUtils from '@/utils/logUtils'
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
import textUtils, { SYSTEM_FONTS } from './textUtils'
import uploadUtils from './uploadUtils'
import { WebViewUtils } from './webViewUtils'

export type IViviStickerProFeatures = 'object' | 'text' | 'background' | 'frame' | 'template' | 'bg-remove'

declare let window: CustomWindow

/**
 * shown prop indicates if the user-setting-config is shown in the setting page
 */
const USER_SETTINGS_CONFIG: { [key: string]: { default: any, description: string, shown: boolean, val?: any, isList?: boolean } } = {
  autoSave: {
    default: false,
    description: 'STK0012',
    shown: true
  },
  emojiSetting: {
    default: 0,
    description: 'STK0058',
    shown: true,
    isList: true
  },
  mydesignShowMissingPhotoAsk: {
    default: true,
    description: 'STK0036',
    shown: false,
    val: true
  }
}

interface IUserSettingListOption {
  val: any
  description: string
  icon?: string
  queryFunc?: (query: string) => boolean
}

const USER_SETTINGS_LIST_CONFIG: { [key: string]: IUserSettingListOption[] } = {
  emojiSetting: [
    {
      // val: 'Apple Color Emoji',
      val: '-apple-system',
      description: '<P>Apple Emoji',
      icon: 'apple_emoji',
      queryFunc: (query: string) => SYSTEM_FONTS.includes(query)
    },
    {
      val: 'zVUjQ0MaGOm7HOJXv5gB',
      description: '<P>Noto Color Emoji',
      icon: 'noto_color_emoji',
    },
    {
      val: 'dLe1S0oDanIJjvty5RxG',
      description: '<P>Noto Emoji',
      icon: 'noto_emoji'
    },
  ],
}

export const MODULE_TYPE_MAPPING: { [key: string]: string } = {
  objects: 'svg',
  textStock: 'text',
  background: 'background',
  font: 'font',
  'templates/story': 'template',
  'templates/post': 'template'
}

const MYDESIGN_TAGS = [{
  name: 'NN0005',
  tab: 'text'
}, {
  name: 'STK0085',
  tab: 'object'
}, {
  name: 'NN0001',
  tab: 'template'
}, {
  name: 'NN0002',
  tab: 'image'
}] as IMyDesignTag[]

class ViviStickerUtils extends WebViewUtils<IUserInfo> {
  appLoadedSent = false
  isAnyIOSImgOnError = false
  hasCopied = false
  everEntersDebugMode = false
  tutorialFlags = {} as { [key: string]: boolean }
  editorStateBuffer = {} as { [key: string]: any }

  DEFAULT_USER_INFO: IUserInfo = {
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
    'subscribeInfo',
    'subscribeResult',
    'internalError',
    'validJsonResult'
  ]

  VVSTK_CALLBACKS = [
    'updateInfoDone',
    'listAssetResult',
    'copyDone',
    'thumbDone',
    'addAssetDone',
    'deleteAssetDone',
    'deleteImageDone',
    'getAssetResult',
    'uploadImageURL',
    'informWebResult',
    'screenshotDone',
    'cloneImageDone',
    'saveImageDone'
  ]

  SCREENSHOT_CALLBACKS = [
    'thumbDone',
    'informWebResult'
  ]

  CALLBACK_MAPS = {
    router: this.ROUTER_CALLBACKS,
    vvstk: this.VVSTK_CALLBACKS,
    screenshot: this.SCREENSHOT_CALLBACKS
  }

  get MAX_PAGE_NUM(): number {
    return 40
  }

  get editorType(): string {
    return store.getters['vivisticker/getEditorType']
  }

  get editorTypeTextLike(): string {
    return store.getters['vivisticker/getEditorTypeTextLike']
  }

  get editorTypeTemplate(): string {
    return store.getters['vivisticker/getEditorTypeTemplate']
  }

  get controllerHidden(): boolean {
    return store.getters['webView/getControllerHidden']
  }

  get inBrowserMode(): boolean {
    return store.getters['vivisticker/getInBrowserMode']
  }

  get userSettings(): IUserSettings {
    return store.getters['vivisticker/getUserSettings']
  }

  get isPaymentDisabled(): boolean {
    return !this.checkVersion('1.26')
  }

  get isOldPrice(): boolean {
    return !this.checkVersion('1.42')
  }

  get isGetProductsSupported(): boolean {
    return this.checkVersion('1.45')
  }

  get isTemplateSupported(): boolean {
    return store.getters['vivisticker/getDebugMode'] || (this.checkVersion('1.34'))
  }

  get isBgRemoveSupported(): boolean {
    return store.getters['vivisticker/getDebugMode'] || (this.checkVersion('1.35'))
  }

  getUserInfoFromStore(): IUserInfo {
    return store.getters['vivisticker/getUserInfo']
  }

  getDefaultUserSettings(): IUserSettings {
    const res = {} as { [key: string]: any }
    for (const [key, value] of Object.entries(USER_SETTINGS_CONFIG)) {
      if (value.shown) {
        res[key] = value.default
        if (value.isList) {
          res[key] = USER_SETTINGS_LIST_CONFIG[key][value.default].val
        }
      }
    }
    return res as IUserSettings
  }

  getUserSettingIsList(key: string): boolean {
    return USER_SETTINGS_CONFIG[key]?.isList ?? false
  }

  getUserSettingOptions(key: string): IUserSettingListOption[] {
    return USER_SETTINGS_LIST_CONFIG[key] ?? []
  }

  getUserSettingDescription(key: string): string {
    return USER_SETTINGS_CONFIG[key]?.description ?? ''
  }

  getDefaultUserConfig<T extends keyof IUserSettingListOption>(key: keyof typeof USER_SETTINGS_CONFIG, by: T, query: IUserSettingListOption[T]): IUserSettingListOption | undefined {
    if (!USER_SETTINGS_CONFIG[key].isList) throw new Error(`getDefaultUserConfig can only query USER_SETTING_CONFIG whose isList=true, provided key: ${key}`)
    const options = USER_SETTINGS_LIST_CONFIG[key]
    return options.find(option => option.queryFunc ? option.queryFunc(query) : option[by] === query) ?? options[0]
  }

  addFontForEmoji(emoji?: string) {
    emoji = emoji ?? this.userSettings.emojiSetting
    if (SYSTEM_FONTS.includes(emoji)) return
    store.dispatch('text/addFont', {
      face: emoji,
      type: 'public',
      ver: store.getters['user/getVerUni']
    })
  }

  addFontForEmojis() {
    for (const emojiConfig of USER_SETTINGS_LIST_CONFIG.emojiSetting) {
      this.addFontForEmoji(emojiConfig.val)
    }
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
    this.DEFAULT_USER_INFO.locale = locale
  }

  async setDefaultPrices() {
    const userInfo = this.getUserInfoFromStore()
    const locale = isV1_42(userInfo) ? userInfo.storeCountry : constantData.countryMap223.get(i18n.global.locale) ?? 'USA'
    const defaultPrices = store.getters['vivisticker/getPayment'].defaultPrices as { [key: string]: IPrices }
    const localPrices = this.isGetProductsSupported ? await this.getState('prices') : (await this.getState('subscribeInfo'))?.prices
    store.commit('vivisticker/UPDATE_payment', { prices: Object.assign(defaultPrices[locale], localPrices) })
    store.commit('vivisticker/SET_paymentPending', { info: false })
  }

  addDesignDisabled() {
    return this.everEntersDebugMode || window.location.hostname !== 'sticker.vivipic.com'
  }

  // filterLog(messageType: string, message: any) {
  //   switch (messageType) {
  //     case 'SET_STATE':
  //       return message.key === 'tempDesign'
  //   }
  //   return false
  // }

  appToast(msg: string) {
    this.sendToIOS('SHOW_TOAST', { msg })
  }

  sendDoneLoading(width: number, height: number, options: string, params: string, toast?: boolean) {
    this.sendToIOS('DONE_LOADING', { width, height, options, params, ...(toast !== undefined && { toast }) })
  }

  sendScreenshotUrl(query: string, action = 'copy') {
    this.sendToIOS('SCREENSHOT', { params: query, action })
    if (this.inBrowserMode) {
      const url = `${window.location.origin}/screenshot/?${query}`
      window.open(url, '_blank')
    }
  }

  /**
   * Sequentially download multiple pages, and returns whether the operation succeeded or not.
   *
   * @param action - Either 'download' to download pages or 'IGPost' to open IG post after download.
   * @param pageIndex - An array of target page index.
   * @param cbProgress - A callback function called when each download succeeded.
   * @return A boolean indicating whether the operation succeeded or not.
   */
  async multiPageDownload(action: 'download' | 'IGPost', pageIndex: number[], cbProgress: (progress: number) => void): Promise<boolean> {
    for (let idx = 0; idx < pageIndex.length; idx++) {
      const isLast = idx === pageIndex.length - 1
      const _action = isLast && action === 'IGPost' ? 'IGPost' : 'download'
      const toast = action === 'download' ? isLast : false
      const query = this.createUrlForJSON({ page: pageUtils.getPage(pageIndex[idx]), noBg: false, toast })
      if (this.inBrowserMode) {
        const url = `${window.location.origin}/screenshot/?${query}`
        window.open(url, '_blank')
        cbProgress(idx + 1)
        continue
      }
      const data = await this.callIOSAsAPI('SCREENSHOT', { params: query, action: _action, finalAction: action }, `screenshot-${query}`, { timeout: -1 })
      const succeeded = data?.flag === '0'
      if (succeeded) cbProgress(idx + 1)
      else return false
    }
    return true
  }

  copyWithScreenshotUrl(query: string, afterCopy?: (flag: string) => void) {
    this.callIOSAsAPI('SCREENSHOT', { params: query, action: 'editorResizeCopy' }, `screenshot-${query}`).then((data) => {
      afterCopy && afterCopy(data?.flag ?? '0')
    })
  }

  downloadWithScreenshotUrl(query: string, afterDownload?: (flag: string) => void) {
    this.callIOSAsAPI('SCREENSHOT', { params: query, action: 'editorResizeDownload' }, `screenshot-${query}`).then((data) => {
      afterDownload && afterDownload(data?.flag ?? '0')
    })
  }

  screenshotDone(data: { flag: string, params: string, action: string }) {
    const query = data.params.startsWith('type=json') ? data.params.replace(/'/g, '\\\'') : data.params
    this.handleCallback(`screenshot-${query}`, data)
  }

  cloneImageDone(data: any) {
    this.handleCallback(`screenshot-${data.type}-${data.srcId}-${data.desId}`, data)
  }

  sendAppLoaded() {
    if (!this.appLoadedSent) {
      this.sendToIOS('APP_LOADED', {
        hideReviewRequest: false,
        logJsonContent: true
      })
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
      // case 7: deprecated
      //   return `type=text&id=${item.id}&ver=${item.ver}`
      case 1:
        return `type=background&id=${item.id}&ver=${item.ver}`
      default:
        return ''
    }
  }

  createUrlForJSON({ page = undefined, asset = undefined, source = undefined, noBg = true, toast = undefined }: { page?: IPage, asset?: IMyDesign, source?: string, noBg?: boolean, toast?: boolean } = {}): string {
    page = page ?? pageUtils.currFocusPage
    // since in iOS this value is put in '' enclosed string, ' needs to be escaped.
    let res = `type=json&id=${encodeURIComponent(JSON.stringify(uploadUtils.getSinglePageJson(page))).replace(/'/g, '\\\'')}&noBg=${noBg}`
    if (asset) {
      const key = this.mapEditorType2MyDesignKey(asset.type)
      res += `&thumbType=mydesign&designId=${asset.id}&key=${key}`
    }
    if (source) {
      res += `&source=${source}`
    }
    if (toast !== undefined) {
      res += `&toast=${toast}`
    }
    return res
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
      if (asset.type === 6) {
        store.commit('vivisticker/SET_isInGroupTemplate', false)
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

  getPageSize(editorType: string) {
    const elTop = document.getElementsByClassName('vivisticker__top')[0]
    const headerHeight = 44
    const editorWidth = elTop.clientWidth
    const editorHeight = (elTop.clientHeight - headerHeight)
    const shortEdge = Math.min(editorWidth, editorHeight)
    if (editorType === 'story') {
      const targetAspectRatio = 9 / 16
      const footerHeight = 60
      const maxPageWidth = Math.round(editorWidth * 0.9)
      const maxPageHeight = Math.round(editorHeight - shortEdge * 0.05 - footerHeight)
      const aspectRatio = maxPageWidth / maxPageHeight
      if (aspectRatio > targetAspectRatio) {
        return {
          width: Math.round(maxPageHeight * targetAspectRatio),
          height: maxPageHeight,
        }
      } else {
        return {
          width: maxPageWidth,
          height: Math.round(maxPageWidth / targetAspectRatio),
        }
      }
    }

    const pageSize = Math.round(shortEdge * 0.9)
    return {
      width: pageSize,
      height: pageSize,
    }
  }

  startEditing(editorType: string, assetInfo: { [key: string]: any }, initiator: () => Promise<any>, callback: (jsonData: any) => void, designId?: string) {
    pageUtils.setPages([pageUtils.newPage({
      ...this.getPageSize(editorType),
      backgroundColor: '#F8F8F8'
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
    imageUtils.setImgControlDefault(false)
    editorUtils.setInBgSettingMode(false)
    pageUtils.setBackgroundImageControlDefault()
    store.commit('SET_currActivePageIndex', 0)
    pageUtils.setPages()
    this.showController()
    this.setState('tempDesign', { design: 'none' })
    store.commit('vivisticker/SET_editorType', 'none')
    store.commit('vivisticker/SET_templateShareType', 'none')
  }

  hideController() {
    store.commit('webView/SET_controllerHidden', true)
  }

  showController() {
    store.commit('webView/SET_controllerHidden', false)
  }

  detectIfInApp() {
    if (window.webkit?.messageHandlers?.APP_LOADED === undefined) {
      this.enterBrowserMode()
      this.setDefaultLocale()
    }
  }

  enterBrowserMode() {
    store.commit('vivisticker/SET_inBrowserMode', true)
  }

  deselect() {
    if (this.editorTypeTextLike || this.editorTypeTemplate) {
      groupUtils.deselect()
      editorUtils.setInMultiSelectionMode(false)
      // store.commit('SET_currActivePageIndex', 0)
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

  copyEditorCore(sender: () => Promise<string>, callback?: (flag: string) => void) {
    const executor = () => {
      nextTick(() => {
        this.preCopyEditor()
        nextTick(() => {
          setTimeout(() => {
            sender().then((flag) => {
              this.postCopyEditor()
              callback && callback(flag)
            })
          }, 500) // wait for soft keyboard to close
        }) // wait for HeaderTabs to update height
      })
    }
    if (store.getters['text/getIsFontLoading']) {
      this.sendToIOS('SHOW_LOADING', this.getEmptyMessage())
      textUtils.untilFontLoadedForPage(pageUtils.currFocusPage).then(() => {
        setTimeout(executor, 200) // in case the render slightly delays after font loading
      })
    } else {
      executor()
    }
  }

  copyEditor(callback?: (flag: string) => void) {
    this.copyEditorCore(this.sendCopyEditor.bind(this), callback)
  }

  downloadEditor(callback?: (flag: string) => void) {
    this.copyEditorCore(this.sendDownloadEditor.bind(this), callback)
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
    if (this.inBrowserMode) return this.getUserInfoFromStore()
    await this.callIOSAsAPI('LOGIN', this.getEmptyMessage(), 'login')
    return this.getUserInfoFromStore()
  }

  loginResult(info: Omit<IUserInfo, 'modelName'> & { modelName?: string }) {
    // input info may not contain modelName
    if (info.modelName === undefined) { // if modelName isn't included, set '' as default
      info.modelName = ''
    }
    let mappedLocale = localeUtils.mapNativeLocale(info.locale)
    if (mappedLocale === undefined) {
      mappedLocale = localeUtils.defaultLocale
      this.updateLocale(mappedLocale) // if default fallback happens, update Native locale accordingly.
    }
    info.locale = mappedLocale
    // after previous handle, info is assured to have modelName
    store.commit('vivisticker/SET_userInfo', info as IUserInfo)
    this.handleCallback('login')
  }

  async updateLocale(locale: string): Promise<boolean> {
    localStorage.setItem('locale', locale) // set locale to localStorage whether browser mode or not
    if (this.inBrowserMode) {
      return true
    }
    const data = await this.callIOSAsAPI('UPDATE_USER_INFO', { locale }, 'update-user-info')
    return data?.flag === '0'
  }

  updateInfoDone(data: { flag: '0' } | { flag: '1', msg: string }) {
    if (data.flag !== '0') {
      this.errorMessageMap.locale = data.msg
      if (data.msg.includes('fail to update locale')) {
        this.showUpdateModal()
      }
    }
    this.handleCallback('update-user-info', data)
  }

  async listAsset(key: string): Promise<void> {
    if (this.inBrowserMode) return
    await this.callIOSAsAPI('LIST_ASSET', { key }, `list-asset-${key}`)
  }

  async listMoreAsset(key: string, nextPage: number): Promise<void> {
    if (this.inBrowserMode) return
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
    let igLayout
    if (data.key.startsWith('templates')) igLayout = data.key.split('/')[1] as 'story' | 'post' | undefined
    const designIds = data.assets.map(asset => asset.id)
    listApis.getInfoList(MODULE_TYPE_MAPPING[data.key], designIds, igLayout).then((response) => {
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
    if (this.inBrowserMode) return
    if (this.checkVersion('1.27')) {
      await this.callIOSAsAPI('ADD_ASSET', { key, asset, limit, files }, `addAsset-${key}-${asset.id}`)
    } else if (this.checkVersion('1.9')) {
      await this.callIOSAsAPI('ADD_ASSET', { key, asset, limit, files }, 'addAsset')
    } else {
      this.sendToIOS('ADD_ASSET', { key, asset })
    }
  }

  addAssetDone(data: { key: string, id: string } | undefined) {
    if (data !== undefined) {
      this.handleCallback(`addAsset-${data.key}-${data.id}`)
    } else {
      this.handleCallback('addAsset')
    }
  }

  async setState(key: string, value: any) {
    if (this.inBrowserMode) return
    if (key === 'tempDesign') {
      // console.trace()
    }
    if (this.checkVersion('1.27')) {
      await this.callIOSAsAPI('SET_STATE', { key, value }, `setState-${key}`)
    } else if (this.checkVersion('1.9')) {
      await this.callIOSAsAPI('SET_STATE', { key, value }, 'setState')
    } else {
      this.sendToIOS('SET_STATE', { key, value })
    }
  }

  setStateDone(data: { key: string } | undefined) {
    if (data !== undefined) {
      this.handleCallback(`setState-${data.key}`)
    } else {
      this.handleCallback('setState')
    }
  }

  async getState(key: string): Promise<WEBVIEW_API_RESULT> {
    if (this.inBrowserMode) return
    return await this.callIOSAsAPI('GET_STATE', { key }, `getState-${key}`, { retry: true })
  }

  getStateResult(data: { key: string, value: string }) {
    this.handleCallback(`getState-${data.key}`, data.value ? JSON.parse(data.value) : undefined)
  }

  async isValidJson(data: object): Promise<boolean> {
    if (!this.checkVersion('1.42')) return true
    const id = generalUtils.generateRandomString(8)
    const valid = ((await this.callIOSAsAPI('IS_VALID_JSON', { object: data, id }, `checkJsonValid-${id}`))?.valid ?? '0')
    return valid === '1'
  }

  validJsonResult(data: { valid: string, id: string }) {
    this.handleCallback(`checkJsonValid-${data.id}`, data)
  }

  async uploadReportedDesign() {
    const pages = pageUtils.getPages
    const editorType = store.getters['vivisticker/getEditorType']
    const editingDesignId = store.getters['vivisticker/getEditingDesignId']
    const assetInfo = store.getters['vivisticker/getEditingAssetInfo']
    try {
      const design = {
        pages: uploadUtils.prepareJsonToUpload(pages),
        editorType,
        id: editingDesignId,
        assetInfo
      } as ITempDesign
      await uploadUtils.uploadReportedDesign(design, { id: design.id })
    } catch (error: any) {
      logUtils.setLogAndConsoleLog('uploading reported design failed:', { editorType, id: editingDesignId, assetInfo, pages })
      logUtils.setLogForError(error as Error)
      logUtils.setLogAndConsoleLog('skip uploading and go on')
    }
  }

  async sendCopyEditorCore(action: string): Promise<string> {
    if (this.inBrowserMode) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return '0'
    }
    const { x, y, width, height } = this.getEditorDimensions()
    const data = await this.callIOSAsAPI('SCREENSHOT', {
      params: '',
      action,
      width,
      height,
      x,
      y,
      bgColor: store.getters['vivisticker/getEditorBg'] // for older app
    }, 'copy-editor', { timeout: -1 })
    return (data?.flag as string) ?? '0'
  }

  async sendCopyEditor(): Promise<string> {
    return await this.sendCopyEditorCore('editorCopy')
  }

  async sendDownloadEditor(): Promise<string> {
    return await this.sendCopyEditorCore('editorDownload')
  }

  copyDone(data: { flag: string }) {
    this.handleCallback('copy-editor', data)
  }

  saveDesign(pages_?: IPage[]) {
    if (this.inBrowserMode) return
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

  importDesign() {
    fileUtils.import((result: string) => {
      const importedDesign = JSON.parse(result)
      importedDesign.id = undefined
      this.initWithTempDesign(importedDesign)
    })
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
    const isValidJson = await this.isValidJson(uploadUtils.prepareJsonToUpload(pageUtils.getPages))
    if (!isValidJson) {
      logUtils.setLog('Saving design as myDesign failed, because the design json is invalid')
      this.uploadReportedDesign()
      this.setLoadingOverlayShow(false)
      throw new Error('save design failed')
    }
    const editingDesignId = store.getters['vivisticker/getEditingDesignId']
    const id = editingDesignId !== '' ? editingDesignId : generalUtils.generateAssetId()
    const onThumbError = async (flag: string, saveDesign: boolean) => {
      if (saveDesign) {
        await this.saveDesignJson(id)
      }
      logUtils.setLog(`Generating myDesign thumbnail failed, flag: ${flag}`)
      this.setLoadingOverlayShow(false)
      throw new Error('gen thumb failed')
    }
    if (store.getters['vivisticker/getEditorTypeTemplate']) {
      this.setLoadingOverlay([i18n.global.t('STK0084')])
      const resGenThumb = await this.callIOSAsAPI('INFORM_WEB', {
        info: {
          event: 'gen-thumb',
          id
        },
        to: 'Shot'
      }, 'gen-thumb', { timeout: -1 }) as any
      if (!resGenThumb || resGenThumb.flag !== '0') await onThumbError(resGenThumb?.flag ?? '1', true)
    } else {
      const flag = await this.genThumbnail(id)
      if (flag !== '0') await onThumbError(flag, false)
    }
    await this.saveDesignJson(id)
    this.setLoadingOverlayShow(false)
  }

  setPages(pages: IPage[]) {
    logUtils.setLogAndConsoleLog('debugInfo@setPages', JSON.stringify(pages.map(page => page.id)))
    layerUtils.setAutoResizeNeededForLayersInPages(pages, true)
    store.commit('SET_pages', pages)
  }

  async genThumbnail(id: string): Promise<string> {
    if (this.inBrowserMode) return '0'
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

  saveImageDone(data: { imageId: string, flag: string, msg?: string }) {
    this.handleCallback('save-image-from-url', data)
  }

  // this is delete something from "local storage"
  async deleteAsset(key: string, id: string, thumbType?: string): Promise<void> {
    if (this.checkVersion('1.27')) {
      await this.callIOSAsAPI('DELETE_ASSET', { key, id, thumbType }, `delete-asset-${key}-${id}`)
    } else {
      await this.callIOSAsAPI('DELETE_ASSET', { key, id, thumbType }, 'delete-asset')
    }
    store.commit('vivisticker/UPDATE_deleteDesign', { tab: this.myDesignKey2Tab(key), id })
  }

  deleteAssetDone(data: { key: string, id: string } | undefined) {
    if (data !== undefined) {
      this.handleCallback(`delete-asset-${data.key}-${data.id}`)
    } else {
      this.handleCallback('delete-asset')
    }
  }

  deleteImage(key: string, name: string, type: string, designId?: string): Promise<unknown> {
    store.commit('vivisticker/UPDATE_deleteDesign', { tab: this.myDesignKey2Tab(key), name })
    return this.callIOSAsAPI('DELETE_IMAGE', { key, name, type, designId }, `delete-image-${key}-${name}`)
  }

  deleteImageDone(data: { key: string, flag: number, name: string }) {
    if (data !== undefined) {
      this.handleCallback(`delete-image-${data.key}-${data.name}`, data)
    } else {
      this.handleCallback('delete-image', data)
    }
  }

  async saveDesignJson(id: string): Promise<IMyDesign | undefined> {
    if (this.inBrowserMode) return
    await Promise.race([
      imageShadowUtils.iosImgDelHandler(),
      new Promise((resolve) => setTimeout(resolve, 3000))
    ])
    const pages = pageUtils.getPages
    const editorType = store.getters['vivisticker/getEditorType']
    const editorTypeTemplate = store.getters['vivisticker/getEditorTypeTemplate']
    const assetInfo = store.getters['vivisticker/getEditingAssetInfo']
    const json = {
      type: editorType,
      id,
      updateTime: new Date(Date.now()).toISOString(),
      assetInfo: {
        ...assetInfo,
        ...(editorTypeTemplate && {
          pageNum: pages.length
        })
      }
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
    const { width: pageWidth, height: pageHeight } = pageUtils.getPageSize(pageUtils.currFocusPageIndex)
    const editorEle = document.getElementById(`vvstk-page-${pageUtils.currFocusPageIndex}`) as HTMLElement
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
    const { images } = ((await this.callIOSAsAPI('UPLOAD_IMAGE', { limit }, 'upload-image', { timeout: 60000, cancelOnConfict: true })) ?? { images: [] }) as IIosImgData
    return images
  }

  uploadImageURL(data: any) {
    this.handleCallback('upload-image', data)
  }

  informWebResult(data: { info: any }) {
    const { info } = data
    const { event } = info
    switch (event) {
      case 'missing-image':
        this.handleMissingImage(info)
        break
      case 'gen-thumb':
        this.fetchDesign().then((design) => {
          if (!design || !design.pages.length) return
          const url = `type=gen-thumb&id=${encodeURIComponent(JSON.stringify(uploadUtils.getSinglePageJson(design.pages[0])))}&noBg=false&designId=${info.id}`
          window.fetchDesign(url)
        })
        break
      case 'gen-thumb-done':
        this.handleCallback('gen-thumb', info)
        break
      case 'screenshot-timeout':
        this.handleCallback(info.srcEvent, { flag: '9999' }) // 9999 for timeout
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
            layerUtils.initLoadingFlags(page, () => {
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
    switch (editorType) {
      case 'objectGroup':
        return 'object'
      case 'story':
      case 'post':
        return 'template'
    }
    return editorType
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

  async fetchTutorialFlags() {
    this.tutorialFlags = (await this.getState('tutorialFlags')) ?? {}
  }

  async updateTutorialFlags(updateItem: { [key: string]: boolean }) {
    Object.assign(this.tutorialFlags, updateItem)
    await this.setState('tutorialFlags', this.tutorialFlags)
  }

  openPayment(target?: IViviStickerProFeatures) {
    if (this.isPaymentDisabled) {
      this.showUpdateModal()
      return
    }
    store.commit('vivisticker/SET_fullPageConfig', { type: 'payment', params: { target } })
  }

  checkPro(item: { plan?: number }, target?: IViviStickerProFeatures) {
    const isPro = store.getters['vivisticker/getPayment'].subscribe
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
    const isSubscribed = subscribe === '1'
    const prices = { currency: priceCurrency }
    const planIds = store.getters['vivisticker/getPayment'].planId
    data.planInfo.forEach(p => {
      const plan = Object.keys(planIds).find(plan => planIds[plan] === p.planId)
      if (!plan) return
      Object.assign(prices, {
        [plan]: {
          value: parseFloat(p.priceValue),
          text: p.priceText
        }
      })
    })
    const subscribeInfo = { subscribe: isSubscribed, prices }
    store.commit('vivisticker/UPDATE_payment', subscribeInfo)
    store.commit('vivisticker/SET_paymentPending', { info: false })
    this.getState('subscribeInfo').then(subscribeInfo => {
      if (subscribeInfo?.subscribe && !isSubscribed) {
        this.setState('showPaymentInfo', { count: 1, timestamp: Date.now() })
      }
    })
    if (monthly.priceValue !== '' && annually.priceValue !== '') {
      this.setState('subscribeInfo', subscribeInfo)
    }
  }

  getSubscribeInfo() {
    const planIds = Object.values(store.getters['vivisticker/getPayment'].planId).concat(Object.values(constantData.planId))
    this.sendToIOS('SUBSCRIBE', { option: 'checkState' })
    this.sendToIOS('SUBSCRIBE', { option: 'getProducts', planId: planIds })
  }

  subscribeResult(data: ISubscribeResult | ISubscribeResultV1_45) {
    if (this.isPaymentDisabled) return
    if (this.isGetProductsSupported && isGetProducts(data) || isCheckState(data)) {
      data = data as ISubscribeResultV1_45
      if (data.reason) return
      if (isGetProducts(data)) {
        const { planInfo, priceCurrency } = data
        const planIds = store.getters['vivisticker/getPayment'].planId
        const prices = { currency: priceCurrency }
        planInfo.forEach(p => {
          const plan = Object.keys(planIds).find(plan => planIds[plan] === p.planId)
          plan && Object.assign(prices, {
            [plan]: {
              value: parseFloat(p.priceValue),
              text: p.priceText
            }
          })
        })
        const annuallyPriceOriginal = planInfo.find(p => p.planId === constantData.planId.annually)
        const annuallyFree0PriceOriginal = planInfo.find(p => p.planId === constantData.planId.annuallyFree0)
        Object.assign(prices, {
          ...(annuallyPriceOriginal && { annuallyOriginal: {
            value: parseFloat(annuallyPriceOriginal.priceValue),
            text: annuallyPriceOriginal.priceText
          }}),
          ...(annuallyFree0PriceOriginal && { annuallyFree0Original: {
            value: parseFloat(annuallyFree0PriceOriginal.priceValue),
            text: annuallyFree0PriceOriginal.priceText
          }})
        })
        store.commit('vivisticker/UPDATE_payment', { prices })
        this.setState('prices', prices)
      }
      else if (isCheckState(data)) {
        const { subscribe, complete } = data
        if (complete === '0') this.registerSticker()
        const isSubscribed = subscribe === '1'
        const subscribeInfo = { subscribe: isSubscribed }
        store.commit('vivisticker/UPDATE_payment', subscribeInfo)
        this.getState('subscribeInfo').then(subscribeInfo => {
          if (subscribeInfo?.subscribe && !isSubscribed) {
            this.setState('showPaymentInfo', { count: 1, timestamp: Date.now() })
          }
        })
        this.setState('subscribeInfo', subscribeInfo)
      }
      return
    }
    if (!store.getters['vivisticker/getIsPaymentPending']) return // drop result if is timeout
    if (!data.reason) {
      const isSubscribed = data.subscribe === '1'
      store.commit('vivisticker/UPDATE_payment', { subscribe: isSubscribed })
      if (isSubscribed) store.commit('vivisticker/SET_fullPageConfig', { type: 'welcome', params: {} })
      this.getState('subscribeInfo').then(subscribeInfo => {
        this.setState('subscribeInfo', { ...subscribeInfo, subscribe: isSubscribed })
      })
    } else if (data.reason === 'IAP_DISABLED'){
      modalUtils.setModalInfo(
        i18n.global.t('STK0024'),
        [i18n.global.t('STK0096')],
        {
          msg: i18n.global.t('STK0023'),
        },
      )
    }
    store.commit('vivisticker/SET_paymentPending', { purchase: false, restore: false })
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

  internalError(data: { route: string, data: { [key: string]: any } }) {
    console.error(`Error occurs in App when processing ${data.route} with ${JSON.stringify(data.data)}`)
  }

  openFullPageVideo(key: keyof IStickerVideoUrls, { delayedClose = undefined, mediaPos = 'top' }: Pick<IFullPageVideoConfigParams, 'delayedClose' | 'mediaPos'> = {}) {
    const stickerVideoUrls = constantData.stickerVideoUrls()
    store.commit('vivisticker/SET_fullPageConfig', {
      type: 'video',
      params: {
        video: stickerVideoUrls[key].video,
        thumbnail: stickerVideoUrls[key].thumbnail,
        delayedClose,
        mediaPos
      }
    })
  }

  handleIos16Video() {
    if (!this.hasCopied && this.checkOSVersion('16.0')) {
      this.hasCopied = true
      this.setState('hasCopied', { data: this.hasCopied })
      modalUtils.setModalInfo(i18n.global.t('STK0033').toString(), i18n.global.t('STK0034').toString(), {
        msg: i18n.global.t('STK0035').toString(),
        action: () => {
          this.openFullPageVideo(constantData.checkIfUseNewLogic() ? 'tutorial1' : 'iOS', { delayedClose: 5000 })
          modalUtils.clearModalInfo()
        }
      }, undefined, {
        noClose: true,
        noCloseIcon: true
      })
    }
  }

  showUpdateModal(force = false) {
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
      noClose: force,
      noCloseIcon: force,
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

  showMaxPageNumModal() {
    modalUtils.setModalInfo(
      i18n.global.t('STK0073'),
      i18n.global.t('STK0074', { num: this.MAX_PAGE_NUM }),
      {
        msg: i18n.global.t('NN0563'),
        class: 'btn-black-mid',
      }
    )
  }

  async saveToIOS(src: string, type = 'png', param?: {
    key?: string,
    designId?: string,
    name?: string,
    toast?: boolean
  }, callback?: (data: { flag: string, msg: string, imageId: string }) => void) {
    await this.callIOSAsAPI('SAVE_IMAGE_FROM_URL', { url: src, type, ...param }, 'save-image-from-url').then((data) => {
      const _data = data as { flag: string, msg: string, imageId: string }
      callback && callback(_data)
    })
  }

  scrollIntoPage(pageIndex: number, duration: number): void {
    const currentPage = document.getElementById(`page-card-${pageIndex}`) as HTMLElement
    const container = currentPage && currentPage.parentElement
    if (currentPage && container) {
      const targetPos = currentPage.offsetLeft - parseFloat(window.getComputedStyle(currentPage).marginLeft)
      container.style.transition = `transform ${duration}ms ease-in-out`
      container.style.transform = `translateX(-${targetPos}px)`
      if (pageIndex >= 0 && pageIndex < store.getters.getPageslength) store.commit('SET_middlemostPageIndex', pageIndex)
    }
  }

  setLoadingOverlayShow(value: boolean) {
    store.commit('vivisticker/SET_loadingOverlayShow', value)
  }

  setLoadingOverlayMsgs(msgs: string[]) {
    store.commit('vivisticker/SET_loadingOverlayMsgs', msgs)
  }

  setLoadingOverlay(msgs: string[]) {
    this.setLoadingOverlayMsgs(msgs)
    this.setLoadingOverlayShow(true)
  }

  formatPrice(price: number | string, currency: string, fallbackText?: string, theme?: 'modal' | 'original') {
    const currencyFormatters = {
      TWD: (value: string) => `${value}元`,
      USD: (value: string) => `$${(+value).toFixed(2)}`,
      JPY: (value: string) => {
        if (theme === 'modal') return `¥${value}`
        if (theme === 'original') return `¥${value}円`
        return `¥${value}円(税込)`
      }
    } as { [key: string]: (value: string) => string }
    if (!Object.keys(currencyFormatters).includes(currency)) return fallbackText ?? currencyFormatters.USD(price.toString())
    return currencyFormatters[currency](price.toString())
  }
}

export default new ViviStickerUtils()
