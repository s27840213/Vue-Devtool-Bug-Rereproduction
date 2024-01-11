import listApis from '@/apis/list'
import userApis from '@/apis/user'
import i18n from '@/i18n'
import { ICmLoginResult, IListServiceContentDataItem } from '@/interfaces/api'
import { CustomWindow } from '@/interfaces/customWindow'
import { IFullPagePaymentConfigParams } from '@/interfaces/fullPage'
import { IAsset } from '@/interfaces/module'
import { IPage } from '@/interfaces/page'
import { ICmProFeatures, IPrices } from '@/interfaces/payment'
import router from '@/router'
import store from '@/store'
import generalUtils from '@/utils/generalUtils'
import { HTTPLikeWebViewUtils } from '@/utils/nativeAPIUtils'
import { notify } from '@kyvg/vue3-notification'
import { nextTick } from 'vue'
import assetUtils from './assetUtils'
import constantData from './constantData'
import imageShadowPanelUtils from './imageShadowPanelUtils'
import imageUtils from './imageUtils'
import logUtils from './logUtils'
import modalUtils from './modalUtils'
import pageUtils from './pageUtils'
import uploadUtils from './uploadUtils'

declare let window: CustomWindow

export type GeneralSuccessResponse = {
  flag: '0'
}

export type GeneralFailureResponse = {
  flag: '1' | '2'
  msg: string
}

export type GeneralResponse = GeneralSuccessResponse | GeneralFailureResponse

export type IUserInfo = {
  hostId: string
  appVer: string
  osVer: string
  isFirstOpen: boolean
  statusBarHeight: number
  homeIndicatorHeight: number
  country: string
  modelName: string
  flag: string
  locale: string
  userId: string,
  storeCountry: string
  deviceScale: number
}

export interface IAlbum {
  albumId: string
  albumSize: number
  title: string
  thumbId: string
}

export interface IAlbumListResponse {
  flag: number
  msg?: string
  smartAlbum: IAlbum[]
  myAlbum: IAlbum[]
}

export interface IAlbumContent {
  id: string
  width: number
  height: number
}

export interface IAlbumContentResponse {
  flag: number
  msg?: string
  content: IAlbumContent[]
  pageIndex: number
  nextPage?: number
}

export interface IGetStateResponse {
  flag: number
  key: string
  value: string
}

export interface IIosResponse<T> {
  errorMsg: string
  eventId: string
  hasInternalError: boolean
  output: T
}

export interface ISaveAssetFromUrlResponse {
  type: 'gif' | 'jpg' | 'png' | 'mp4',
  flag: string,
  msg?: string,
  fileId?: string
}

export interface IListAssetResponse {
  flag: string,
  key: string
  assets: any[]
  nextPage: string
  group?: string
}

export interface IPlanInfo {
  planId: string,
  priceText: string,
  priceValue: string
}

export type GetProductResponse = GeneralResponse & { 
  priceCurrency: string,
  monthly: {
    priceValue: string,
    priceText: string
  },
  annually: {
    priceValue: string,
    priceText: string
  },
  planInfo: IPlanInfo[]
}

export type SubscribeResponse = GeneralResponse & { 
  option: string,
  txid?: string,
}

export type FileSource = {
  path: string
  ext: string
} | {
  fileId: string
}

export const MODULE_TYPE_MAPPING: { [key: string]: string } = {
  objects: 'svg',
  textStock: 'text',
  background: 'background',
  font: 'font',
}

class CmWVUtils extends HTTPLikeWebViewUtils<IUserInfo> {
  DEFAULT_USER_INFO: IUserInfo = {
    hostId: '',
    appVer: '100.0',
    osVer: '100.0',
    isFirstOpen: false,
    statusBarHeight: 0,
    homeIndicatorHeight: 0,
    country: '',
    flag: '0',
    locale: 'en',
    modelName: 'web',
    userId: '',
    storeCountry: 'USA',
    deviceScale: 1,
  }

  CALLBACK_MAPS = {
    base: [
      'appBecomeActive',
      'informWebResult'
    ]
  }

  screenshotMap = {} as { [key: string]: (status: string) => void }

  everEntersDebugMode = false
  appLoadedSent = false
  tutorialFlags = {} as { [key: string]: boolean }
  isAnyIOSImgOnError = false

  appBecomeActive() {
    console.log('app become active!')
  }

  informWebResult(data: { info: ({ event: string } & Record<string, unknown>) }) {
    const { info } = data
    const { event } = info
    switch (event) {
      case 'screenshot':
        window.fetchDesign(info.query, info)
        break
      case 'screenshot-result':
        this.screenshotMap[(info.options as { imageId: string }).imageId](info.status as string)
        break
          }
  }

  get inBrowserMode() {
    return store.getters['cmWV/getInBrowserMode']
  }

  get isDuringCopy() {
    return store.getters['cmWV/getIsDuringCopy']
  }

  get isPromoteCountry(): boolean {
    return store.getters['payment/getPromote'].includes(this.getUserInfoFromStore().storeCountry ?? '')
  }

  get isPromoteLanguage(): boolean {
    const promoteLanguages = [...new Set(store.getters['payment/getPromote'].map(this.getLanguageByCountry))]
    return promoteLanguages.includes(this.getUserInfoFromStore().locale)
  }

  get isPromote(): boolean {
    return this.isPromoteCountry && this.isPromoteLanguage
  }

  getUserInfoFromStore(): IUserInfo {
    return store.getters['cmWV/getUserInfo']
  }

  setDuringCopy(bool: boolean) {
    store.commit('cmWV/SET_isDuringCopy', bool)
  }

  setNoBg(bool: boolean) {
    store.commit('cmWV/SET_isNoBg', bool)
  }

  detectIfInApp() {
    if (window.webkit?.messageHandlers?.REQUEST === undefined) {
      this.enterBrowserMode()
    }
  }

  enterBrowserMode() {
    store.commit('cmWV/SET_inBrowserMode', true)
  }

  addDesignDisabled() {
    return this.everEntersDebugMode || window.location.hostname !== 'cm.vivipic.com'
  }

  sendAppLoaded() {
    if (!this.inBrowserMode && !this.appLoadedSent) {
      this.sendToIOS('REQUEST', this.makeAPIRequest('APP_LOADED', {}), true)
      this.appLoadedSent = true
    }
  }

  async getUserInfo(): Promise<IUserInfo> {
    if (this.inBrowserMode) return this.DEFAULT_USER_INFO
    const userInfo = await this.callIOSAsHTTPAPI('APP_LAUNCH')
    store.commit('cmWV/SET_userInfo', userInfo)
    return userInfo as IUserInfo
  }

  // Like picWVUtils, need merge.
  async login(type: 'Apple' | 'Google' | 'Facebook', locale: string) {
    const loginResult = await this.callIOSAsHTTPAPI('LOGIN', { type, locale }, { timeout: -1 }) as 
      { data: ICmLoginResult, flag: number, msg?: string }
    if (!loginResult) {
      throw new Error('login failed')
    }

    if (loginResult.flag === 0) {
      store.dispatch('user/loginSetup', { data: loginResult })
      return loginResult
    } else {
      // logUtils.setLogAndConsoleLog('Apple login failed')
      notify({ group: 'error', text: loginResult.msg })
    }
  }

  // Like picWVUtils, need merge.
  async updateUserInfo(userInfo: Partial<IUserInfo>): Promise<void> {
    if (!generalUtils.isCm) return
    store.commit('cmWV/UPDATE_userInfo', userInfo)
    await this.callIOSAsHTTPAPI('UPDATE_USER_INFO', userInfo)
  }

  async getAlbumList(): Promise<IAlbumListResponse> {
    const albumList = await this.callIOSAsHTTPAPI('GET_ALBUM_LIST', undefined, { timeout: -1 })

    return albumList as IAlbumListResponse
  }

  async getAlbumContent(albumId: string, pageIndex: number): Promise<IAlbumContentResponse> {
    const albumList = await this.callIOSAsHTTPAPI('GET_ALBUM_CONTENT', {
      albumId,
      pageIndex,
    }, { timeout: -1 })

    return albumList as IAlbumContentResponse
  }

  /**
   * Save the file from `url` to `path`.
   * @param path If path is udf, save asset to Camera Roll
   */
  async saveAssetFromUrl(ext: 'gif' | 'jpg' | 'png' | 'mp4', url: string, path?: string): Promise<ISaveAssetFromUrlResponse> {
    let retryTimes = 0
    let result
    while (retryTimes < 3) {
      result = await (this.callIOSAsHTTPAPI('SAVE_FILE_FROM_URL', { ext, url, path }, { timeout: -1 }) as Promise<ISaveAssetFromUrlResponse>)
      if (result.flag === '1') {
        retryTimes += 1
      } else {
        break
      }
    }
    return result!
  }

  async switchDomain(url: string): Promise<void> {
    await this.callIOSAsHTTPAPI('SWITCH_DOMAIN', {
      url,
    })
  }

  async copyEditorCore(sender: (...arg: any[]) => Promise<{flag: string, cleanup: () => void, imageId: string}>,
    { senderArgs = [], preArgs = {}, postArgs = {} }: { senderArgs?: any[], preArgs?: Record<string, unknown>, postArgs?: Record<string, unknown> }
  ) {
    return new Promise<{flag: string, cleanup: () => void, imageId: string}>(resolve => {
      const executor = () => {
        nextTick(() => {
          this.preCopyEditor(preArgs)
          setTimeout(() => {
            sender(...senderArgs).then(({ flag, imageId, cleanup }) => {
              this.postCopyEditor(postArgs)
              resolve({ flag, imageId, cleanup: cleanup })
            })
          }, 500) // wait for soft keyboard to close
        })
      }
      executor()
    })
  }

  async copyEditor(pageSize: { width: number, height: number, snapshotWidth?: number }, noBg = false): Promise<{flag: string, cleanup: () => void, imageId: string}> {
    return await this.copyEditorCore(this.sendCopyEditor.bind(this), {
      senderArgs: [pageSize],
      preArgs: { noBg },
    })
  }

  preCopyEditor({ noBg = false }: { noBg?: boolean }) {
    this.setNoBg(noBg)
    this.setDuringCopy(true)
  }

  // eslint-disable-next-line no-empty-pattern
  postCopyEditor({}: object) { // currently no args, only for type-check of this.copyEditorCore to pass
    this.setNoBg(false)
    this.setDuringCopy(false)
  }

  async sendCopyEditor(pageSize: { width: number, height: number, snapshotWidth?: number }): Promise<{flag: string, cleanup: () => void, imageId: string}> {
    const imageId = generalUtils.generateAssetId()
    const { flag, cleanup } = await this.sendCopyEditorCore(pageSize, { path: `screenshot/${imageId}` })
    return {
      flag,
      cleanup,
      imageId
    }
  }

  /**
   * Take screenshot and save it to Camera Roll or Document.
   * @param pageSize 
   * @param param1 If path is udf, save asset to Camera Roll
   */
  async sendCopyEditorCore(
    pageSize: { width: number, height: number, snapshotWidth?: number },
    { ext = 'jpg' as 'jpg' | 'png', quality = 0.85, path = undefined as string | undefined } = {}
  ): Promise<{flag: string, cleanup: () => void}> {
    if (this.inBrowserMode) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        flag: '0',
        cleanup: () => { console.log('empty cleanup') }
      }
    }
    const { x, y, width, height } = this.getEditorDimensions(pageSize)
    const data = await this.callIOSAsHTTPAPI('SCREENSHOT', {
      width,
      height,
      x,
      y,
      path,
      ext,
      quality,
      snapshotWidth: pageSize.snapshotWidth ?? width,
    }, { timeout: -1 }) as GeneralResponse | null | undefined
    return {
      flag: (data?.flag as string) ?? '0',
      cleanup: () => {
        if (path === undefined) return
        this.deleteFile(`screenshot/${path}.${ext}`)
      }
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

  createUrlForJSON({ page = undefined, noBg = true, maskUrl = '' }: { page?: IPage, noBg?: boolean, maskUrl?: string } = {}): string {
    page = page ?? pageUtils.currFocusPage
    // since in iOS this value is put in '' enclosed string, ' needs to be escaped.
    return `type=json&id=${encodeURIComponent(JSON.stringify(uploadUtils.getSinglePageJson(page))).replace(/'/g, '\\\'')}&noBg=${noBg}&maskUrl=${encodeURIComponent(maskUrl)}`
  }

  async sendScreenshotUrl(query: string, { outputType, quality, forGenImage }: { outputType?: string, quality?: number, forGenImage?: boolean } = {}): Promise<{ flag: string, imageId: string, cleanup: () => void }> {
    if (this.inBrowserMode) {
      const url = `${window.location.origin}/screenshot/?${query}`
      window.open(url, '_blank')
      return {
        flag: '0',
        imageId: '',
        cleanup: () => { console.log('empty cleanup') }
      }
    }
    const imageId = generalUtils.generateAssetId()
    await this.callIOSAsHTTPAPI('INFORM_WEB', {
      info: {
        event: 'screenshot',
        query,
        imageId,
        outputType,
        quality,
        forGenImage
      },
      to: 'Shot',
    })
    const status = await Promise.race([
      new Promise<string>(resolve => {
        this.screenshotMap[imageId] = resolve
      }),
      new Promise<string>(resolve => {
        setTimeout(() => {
          resolve('timeout')
        }, 20000)
      })
    ])
    switch (status) {
      case 'error':
      case 'timeout':
        console.log(`Screenshot Failed at ShotWeb with status: ${status}`)
        return {
          flag: '1',
          imageId,
          cleanup: () => { console.log('empty cleanup') }
        }
      // case 'completed': pass
    }
    return {
      flag: '0',
      imageId,
      cleanup: () => {
        this.deleteFile(`screenshot/${imageId}.${outputType ?? 'jpg'}`)
      }
    }
  }

  getEditorDimensions(pageSize: { width: number, height: number }): { x: number; y: number; width: number; height: number } {
    if (router.currentRoute.value.name === 'Screenshot') {
      return { x: 0, y: 0, width: pageSize.width, height: pageSize.height }
    } else {
      const editorEle = document.getElementById('screenshot-target') as HTMLElement
      const defaultDimensions = {
        x: 0,
        y: 0,
        width: pageSize.width,
        height: pageSize.height
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
      if (x <= 0) {
        x = defaultDimensions.x
      }
      if (y <= 0) {
        y = defaultDimensions.y
      }
      return { x, y, width, height }
    }
  }

  getSnapshotWidth({ width, height }: { width: number, height: number }, targetSize: number, type: 'short' | 'long') {
    const isVertical = height > width
    return (isVertical && type === 'short' ? targetSize : targetSize / height * width) / this.getUserInfoFromStore().deviceScale
  }

  async getState(key: string): Promise<any | undefined> {
    if (this.inBrowserMode) return
    const data = await this.callIOSAsHTTPAPI('GET_STATE', { key }, { retry: true }) as IGetStateResponse
    return data.value ? JSON.parse(data.value) : undefined
  }

  async setState(key: string, value: any) {
    if (this.inBrowserMode) return
    await this.callIOSAsHTTPAPI('SET_STATE', { key, value })
  }

  async cloneFile(srcPath: string, desPath: string ) {
    if (this.inBrowserMode) return
    if (/:\/\//.test(srcPath)) {
      const { path, ext } = this.getDocumentPath(srcPath)
      srcPath = `${path}.${ext}`
    }
    await this.callIOSAsHTTPAPI('CLONE_FILE', { srcPath, desPath })
  }
  
  async deleteFile(path: string) {
    if (this.inBrowserMode) return
    await this.callIOSAsHTTPAPI('DELETE_FILE', { path })
  }

  async fetchTutorialFlags() {
    const res = await this.getState('tutorialFlags')
    this.tutorialFlags = res ?? {}
  }

  async updateTutorialFlags(updateItem: { [key: string]: boolean }) {
    Object.assign(this.tutorialFlags, updateItem)
    await this.setState('tutorialFlags', this.tutorialFlags)
  }

  async fetchLoadedFonts(): Promise<void> {
    const loadedFonts = (await this.getState('loadedFonts')) ?? {}
    store.commit('cmWV/SET_loadedFonts', loadedFonts)
  }

  async recordLoadedFont(face: string): Promise<void> {
    store.commit('cmWV/UPDATE_addLoadedFont', face)
    const loadedFonts = store.getters['cmWV/getLoadedFonts'] as { [key: string]: true }
    await this.setState('loadedFonts', { ...loadedFonts })
  }

  async checkFontLoaded(face: string): Promise<boolean> {
    const loadedFonts = store.getters['cmWV/getLoadedFonts'] as { [key: string]: true }
    return loadedFonts[face] ?? false
  }

  // #region payment
  openPayment(target?: ICmProFeatures) {
    const {
      currency,
      monthly: monthlyPrice,
      annually: annuallyPrice,
      annuallyOriginal: annuallyPriceOriginal
    } = store.getters['payment/getPayment'].prices as IPrices
    const params = {
      target,
      theme: 'cm',
      carouselItems: [
        {
          key: 'powerful-fill',
          title: i18n.global.t('CM0001'),
          img: require('@img/png/pricing/cm_pro-powerful-fill.png')
        },
        {
          key: 'ai-reflection',
          title: i18n.global.t('CM0151'),
          img: require('@img/png/pricing/cm_pro-ai-reflection.png')
        },
        {
          key: 'hidden-message',
          title: i18n.global.t('CM0078'),
          img: require('@img/png/pricing/cm_pro-hidden-message.png')
        },
        {
          key: 'magic-combined',
          title: i18n.global.t('CM0152'),
          img: require('@img/png/pricing/cm_pro-magic-combined.png')
        },
        {
          key: 'magic-combined',
          title: i18n.global.t('CM0152'),
          img: require('@img/png/pricing/cm_pro-magic-combined2.png')
        },
      ],
      cards: [
        {
          iconName: 'unlimited',
          title: i18n.global.t('CM0033')
        },
        {
          iconName: 'watermark',
          title: i18n.global.t('CM0034')
        },
        {
          iconName: 'cm_remove-bg',
          title: i18n.global.t('CM0035')
        }
      ],
      btnPlans: [
        {
          key: 'annually',
          title: i18n.global.t('NN0515'),
          subTitle: '',
          price: this.formatPrice(annuallyPrice.value, currency, annuallyPrice.text),
          originalPrice: this.formatPrice(annuallyPriceOriginal.value, currency, annuallyPriceOriginal.text, 'original')
        },
        {
          key: 'monthly',
          title: i18n.global.t('NN0514'),
          subTitle: '',
          price: this.formatPrice(monthlyPrice.value, currency, monthlyPrice.text)
        }
      ],
      comparisons: [],
      termsOfServiceUrl: i18n.global.t('CM0145'),
      privacyPolicyUrl: i18n.global.t('CM0144'),
      defaultTrialToggled: false,
      isPromote: this.isPromoteCountry
    } as IFullPagePaymentConfigParams
    store.commit('SET_fullPageConfig', { type: 'payment', params })
  }

  async setDefaultPrices() {
    const userInfo = this.getUserInfoFromStore()
    const locale = userInfo.storeCountry // TODO: no storeCountry in charmix
    const defaultPrices = store.getters['payment/getPayment'].defaultPrices as { [key: string]: IPrices }
    const localPrices =  await this.getState('prices')
    const prices = localPrices ?? defaultPrices[locale]

    if (!prices) return
    store.commit('payment/UPDATE_payment', { prices })
    store.commit('payment/SET_paymentPending', { info: false })
  }

  async getProducts() {
    if (this.inBrowserMode) return
    const res = await this.callIOSAsHTTPAPI('GET_PRODUCTS', {
      planId: Object.values(store.getters['payment/getPayment'].planId).concat(Object.values(constantData.planId))
    })
    if (!res) return
    const { planInfo, priceCurrency } = res as GetProductResponse
    const planIds = store.getters['payment/getPayment'].planId
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
    store.commit('payment/UPDATE_payment', { prices })
    store.commit('payment/SET_paymentPending', { info: false })
    this.setState('prices', prices)
  }

  async updateSubState(uuid: string, txid?: string, showDupBindModal = true): Promise<{ subscribe: boolean, dupBinded: boolean }> {
    const userInfo = this.getUserInfoFromStore()
    const res = await userApis.getTxInfo({
      token: '',
      app: 'charmix',
      host_id: userInfo.hostId,
      uuid,
      txid
    })
    logUtils.setLogAndConsoleLog('updateSubState', {params: JSON.parse(res.config.data), res: res?.data})
    if (res.data.flag === 0) {
      const isSubscribed = res.data.subscribe === 1
      store.commit('payment/UPDATE_payment', { subscribe: isSubscribed })
      this.getState('subscribeInfo').then(subscribeInfo => {
        this.setState('subscribeInfo', { ...subscribeInfo, subscribe: isSubscribed })
      })
      if (res.data.dup_binded === 1 && showDupBindModal) {
        modalUtils.setModalInfo(
          i18n.global.t('STK0024'),
          [i18n.global.t('CM0134')],
          {
            msg: i18n.global.t('STK0023'),
          },
        )
      }
      return {subscribe: isSubscribed, dupBinded: res.data.dup_binded === 1}
    }
    return {subscribe: false, dupBinded: false}
  }

  async subscribe(planId: string) {
    if (store.getters['payment/getPaymentPending'].purchase) return
    store.commit('payment/SET_paymentPending', { purchase: true })

    if (await this.checkDupSub().catch(err => {
      notify({
        group: 'warn',
        text: err.message,
      })
    })) {
      store.commit('payment/SET_paymentPending', { purchase: false })
      logUtils.setLogAndConsoleLog('duplicated subscription')
      return
    }

    const res = await this.callIOSAsHTTPAPI('SUBSCRIBE', { option: planId }, { timeout: -1 }) as SubscribeResponse

    if (res.flag === '0') {
      const isSubscribed = !!res.txid && (await this.updateSubState('', res.txid)).subscribe
      if (isSubscribed) store.commit('SET_fullPageConfig', { type: 'welcome', params: {} })
    } else if (res.msg === 'IAP_DISABLED'){
      modalUtils.setModalInfo(
        i18n.global.t('STK0024'),
        [i18n.global.t('STK0096')],
        {
          msg: i18n.global.t('STK0023'),
        },
      )
    }

    store.commit('payment/SET_paymentPending', { purchase: false })
  }

  async restore(loginResult?: ICmLoginResult, showResult = false) {
    if (this.inBrowserMode) return
    if (store.getters['payment/getPaymentPending'].restore) return
    store.commit('payment/SET_paymentPending', { restore: true })
    let dupBinded = false
    if (loginResult?.has_tx === 1) { 
      // logged in & is binding
      const isSubscribed = loginResult.subscribe === 1
      store.commit('payment/UPDATE_payment', { subscribe: isSubscribed })
      this.getState('subscribeInfo').then(subscribeInfo => {
        this.setState('subscribeInfo', { ...subscribeInfo, subscribe: isSubscribed })
      })
    } else {
      // not logged in, or logged in but not binding
      const res = await this.callIOSAsHTTPAPI('SUBSCRIBE', { option: 'restore' }, { timeout: 30000 })
      if (res) {
        const { flag, txid } = res as SubscribeResponse
        if(flag === '0' && !!txid) dupBinded = (await this.updateSubState('', txid, false)).dupBinded
      } else {
        logUtils.setLogAndConsoleLog('restore timeout')
        showResult && notify({
          group: 'warn',
          text: 'network timeout',
        })
      }
    }

    store.commit('payment/SET_paymentPending', { restore: false })
    if (showResult) {
      const isPro = store.getters['payment/getPayment'].subscribe
      const title = isPro ? i18n.global.t('CM0135') : i18n.global.t('CM0137')
      const content = (isPro ? i18n.global.t('CM0136') : i18n.global.t('CM0138')) + 
        (dupBinded ? ` ${i18n.global.t('CM0134')}` : '')
      modalUtils.setModalInfo(
        title,
        [content],
        {
          msg: i18n.global.t('STK0023'),
        },
      )
    }
  }

  checkPro(item: { plan?: number }, target?: ICmProFeatures) {
    const isPro = store.getters['payment/getPayment'].subscribe
    if (item.plan === 1 && !isPro) {
      this.openPayment(target)
      return false
    }
    return true
  }

  async checkDupSub(): Promise<boolean> {
    // check for duplicate subscription
    const userInfo = this.getUserInfoFromStore()
    const uuid = store.getters['user/getUuid'] as string
    const isPro = store.getters['payment/getPayment'].subscribe
    if (!uuid || !isPro) return false

    const res = await this.callIOSAsHTTPAPI('SUBSCRIBE', { option: 'restore' }, { timeout: 30000 }) as SubscribeResponse
    if (!res) {
      logUtils.setLogAndConsoleLog('restore timeout')
      throw new Error('network timeout')
    }
    if (res.flag !== '0') throw new Error('restore failed')
    if (!res.txid) {
      modalUtils.setModalInfo(
        i18n.global.t('STK0024'),
        [i18n.global.t('CM0155')],
        {
          msg: i18n.global.t('STK0023'),
        },
      )
      return true
    }

    const currUuid = (await userApis.getTxInfo({
      token: store.getters['user/getGetTxToken'],
      app: 'charmix',
      host_id: userInfo.hostId,
      uuid: '',
      txid: res.txid
    })).data.uuid
    logUtils.setLogAndConsoleLog('checkDupSub', { currUuid, uuid })
    
    if (currUuid !== uuid) {
      modalUtils.setModalInfo(
        i18n.global.t('STK0024'),
        [`${i18n.global.t('CM0155')} ${i18n.global.t('CM0134')}`],
        {
          msg: i18n.global.t('STK0023'),
        },
      )
      return true
    }
    return false
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
  // #endregion

  // #region init popup
  async getPromoteModalInfo(): Promise<{ modalInfoArg: Parameters<typeof modalUtils.setModalInfo>, msg: string } | null> {
    // parse modal info
    const userInfo = this.getUserInfoFromStore()
    const prefix = userInfo.locale + '_'
    const modalInfo = Object.fromEntries(Object.entries(store.getters['cmWV/getModalInfo']).map(
      ([k, v]) => {
        if (k.startsWith(prefix)) k = k.replace(prefix, '')
        return [k, v as any]
      })
    )

    // show popup
    const prices = store.getters['payment/getPrices'] as IPrices
    const subscribed = (await this.getState('subscribeInfo'))?.subscribe ?? false
    const price = this.formatPrice(prices.annually.value, prices.currency, prices.annually.text, 'modal')
    const priceOriginal = prices.annuallyOriginal ? this.formatPrice(prices.annuallyOriginal.value, prices.currency, prices.annuallyOriginal.text, 'modal') : ''
    const isCloseBtnOnly = this.isPromote && subscribed
    const lastModalMsg = await this.getState('lastModalMsg')
    const lastModalTime = await this.getState('lastModalTime')
    const isDuplicated = (lastModalMsg === undefined || lastModalMsg === null) ? false : lastModalMsg.value === modalInfo.msg
    const isCoolDown = (lastModalTime === undefined || lastModalTime === null) ? false : Date.now() - lastModalTime.value < modalInfo.duration * 3600000
    const shown = modalInfo.duration === -1 ? isDuplicated : isDuplicated && isCoolDown // ignore cool down if duration is set to -1
    const isInvalidCountry = !!modalInfo.country.length && !modalInfo.country.includes(userInfo.storeCountry)
    const isPromoteToBeHide = this.isPromoteLanguage && (!this.isPromoteCountry || this.getLanguageByCountry(userInfo.storeCountry ?? 'USA') !== userInfo.locale)
    const btn_txt = modalInfo.btn_txt
    if (!btn_txt || shown || isInvalidCountry || isPromoteToBeHide) return null

    const options = {
      imgSrc: modalInfo.img_url,
      noClose: false,
      noCloseIcon: true,
      backdropStyle: {},
      checkboxText: '',
      checked: false,
      onCheckedChange: (checked: boolean) => { console.log(checked) },
      classes: {
        card: 'bg-white/90 backdrop-blur-[10px]',
        title: 'text-H6 text-gray-2',
        desc: 'body-SM text-gray-2',
        btn: 'bg-black-2 text-gray-7',
        btn2: 'bg-[#D3D3D3] text-gray-2'
      }
    }
    return {
      modalInfoArg: [
        modalInfo.title,
        this.isPromote && priceOriginal ? [`<del>${priceOriginal}</del> → ${price}`, modalInfo.msg] : [modalInfo.msg],
        {
          msg: isCloseBtnOnly ? modalInfo.btn2_txt : btn_txt,
          action: () => {
            if(isCloseBtnOnly) return
            const url = modalInfo.btn_url
            if (url) { window.open(url, '_blank') }
          }
        },
        isCloseBtnOnly ? undefined : {
          msg: modalInfo.btn2_txt || '',
        },
        options
      ],
      msg: modalInfo.msg
    }
  }

  async showInitPopups() {
    const userInfo = this.getUserInfoFromStore()
    const modalInfo = store.getters['cmWV/getModalInfo']
    const showPaymentInfo = await this.getState('showPaymentInfo')
    const isFirstOpen = userInfo.isFirstOpen && showPaymentInfo === undefined
    const subscribed = (await this.getState('subscribeInfo'))?.subscribe ?? false
    const m = parseInt(modalInfo[`pop_${userInfo.locale}_m`])
    const n = parseInt(modalInfo[`pop_${userInfo.locale}_n`])
    const showPaymentTime = showPaymentInfo?.timestamp ?? 0
    const showPaymentCount = (showPaymentInfo?.count ?? 0) + 1
    const diffShowPaymentTime = showPaymentTime ? Date.now() - showPaymentTime : 0
    let isShowPaymentView = isFirstOpen ? modalInfo[`pop_${userInfo.locale}`] === '1'
      : !subscribed && showPaymentCount >= m && diffShowPaymentTime >= n * 86400000
    // charmix doesn't have tutorial videos
    // const isShowTutorial = isFirstOpen && i18n.global.locale !== 'us'
    const showPayment = (cbClose?: () => void) => {
      if (isShowPaymentView) {
        this.openPayment()
        this.setState('showPaymentInfo', { count: 0, timestamp: Date.now() })
        if (cbClose) {
          const unwatch = store.watch((state, getters) => getters.getFullPageConfig.type, (newVal, oldVal) => {
            if (newVal === 'none' && oldVal === 'payment') cbClose()
            unwatch()
          })
        }
        return true
      } else this.setState('showPaymentInfo', { count: showPaymentCount, timestamp: showPaymentTime || Date.now() })
      return false
    }

    const showPromoteModal = async (cbClose?: () => void) => {
      const modalInfo = await this.getPromoteModalInfo()
      if (!modalInfo) return false
      modalUtils.setModalInfo(...modalInfo.modalInfoArg)
      this.setState('lastModalMsg', { value: modalInfo.msg })
      this.setState('lastModalTime', { value: Date.now() })
      this.sendAppLoaded()
      if (cbClose) {
        const unwatch = store.watch((state, getters) => getters['modal/getModalOpen'], (newVal) => {
          if (!newVal) cbClose()
          unwatch()
        })
      }
      return true
    }
    
    if (this.isPromote) {
      // force payment view to show after promote modal closed in promote mode
      if (!subscribed) isShowPaymentView = true
      await showPromoteModal(showPayment)
    } else if (!(showPayment(showPromoteModal) || await showPromoteModal())) {
      // didn't show promote modal or payment
      this.sendAppLoaded()
    }
  }

  getLanguageByCountry(country: string) {
    if (['CHN', 'MAC', 'HKG', 'TWN'].includes(country)) return 'tw'
    if (['JPN'].includes(country)) return 'jp'
    if (['BRA', 'PRT'].includes(country)) return 'pt'
    return 'us'
  }
  // #endregion
  
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

  async listAsset(key: string, group?: string, returnResponse = false): Promise<void | IListAssetResponse> {
    if (this.inBrowserMode || !this.checkVersion('1.0.14')) return;
    const res = await this.callIOSAsHTTPAPI('LIST_ASSET', { key, group });

    if(returnResponse) {
      return res as IListAssetResponse
    }
    if (!res) return;

    this.handleListAssetResult(res as IListAssetResponse);
  }

  async listMoreAsset(key: string, nextPage: number, group?: string, returnResponse = false): Promise<void | IListAssetResponse> {
    if (this.inBrowserMode || !this.checkVersion('1.0.14')) return
    if (nextPage < 0) return
    const res = await this.callIOSAsHTTPAPI('LIST_ASSET', { key, group, pageIndex: nextPage })
    if (!res) return

    if(returnResponse) {
      return res as IListAssetResponse
    }
    this.handleListAssetResult(res as IListAssetResponse)
  }

  handleListAssetResult(data: IListAssetResponse) {
    if (['color', 'backgroundColor', 'giphy'].includes(data.key)) {
      assetUtils.setRecentlyUsed(data.key, data.assets)
      return
    }
    let igLayout
    if (data.key.startsWith('templates')) igLayout = data.key.split('/')[1] as 'story' | 'post' | undefined
    const isHm = data.key.includes('-hm')
    if (isHm) data.key = data.key.replace('-hm', '')

    const designIds = data.assets.map(asset => asset.id)
    listApis.getInfoList(MODULE_TYPE_MAPPING[data.key], designIds, igLayout, isHm ? 1 : 0).then((response) => {
      if (response.data.data.content.length !== 0) {
        const updateList = response.data.data.content[0].list
        data.assets = this.updateAssetContent(data.assets, updateList)
        assetUtils.setRecentlyUsed(data.key, data.assets)
      }
      this.handleCallback(`list-asset-${data.key}`)
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

  async isValidJson(data: object): Promise<boolean> {
    if (!this.checkVersion('1.42')) return true
    const valid = ((await this.callIOSAsHTTPAPI('IS_VALID_JSON', { object: data}))?.valid ?? '0')
    return valid === '1'
  }

  async addAsset(key: string, asset: any, limit = 100, group?: string) {
    if (this.inBrowserMode) return
    if (this.checkVersion('1.0.14')) {
      await this.callIOSAsHTTPAPI('ADD_ASSET', { key, asset, limit, group })
    }
  }

  async addJson(path: string , content: {[index: string]: any}) {
    if (this.inBrowserMode) return
    if (this.checkVersion('1.0.14')) {
      return await this.callIOSAsHTTPAPI('ADD_JSON', { path, content })
    }
  }

  async getJson(path: string) {
    if (this.inBrowserMode) return
    if (this.checkVersion('1.0.14')) {
      return await this.callIOSAsHTTPAPI('GET_JSON', { path })
    }
  }

  async deleteAsset(key: string, id: string, group?: string, updateList = true) {
    return await this.callIOSAsHTTPAPI('DELETE_ASSET', { key, id, group, updateList })
  }

  async uploadFileToS3(source: FileSource, uploadMap: object, s3SubPath: string, size = 1, sizeType: 'short' | 'long' | 'scale' = 'scale') {
    return await this.callIOSAsHTTPAPI('UPLOAD_FILE_TO_S3', { ...source, s3SubPath, size, sizeType, uploadMap }) as GeneralResponse
  }

  getDocumentPath(url: string) {
    const urlObj = new URL(url)
    const path = (urlObj.host + urlObj.pathname).replace('//', '')
    const ext = urlObj.searchParams.get('imagetype') ?? 'png'
    return {
      path,
      ext
    }
  }

  async documentToCameraRoll(path: string, ext: string, size = 1, sizeType: 'short' | 'long' | 'scale' = 'scale') {
    return await this.callIOSAsHTTPAPI('DOCUMENT_TO_CAMERAROLL', { path, ext, size, sizeType }) as GeneralResponse
  }

  async resizeImage(srcPath: string, desPath: string, ext: string, size = 1, sizeType: 'short' | 'long' | 'scale' = 'scale') {
    return await this.callIOSAsHTTPAPI('RESIZE_IMAGE', { srcPath, desPath, ext, size, sizeType }) as GeneralResponse
  }

  async shareFile(path: string) {
    return await this.callIOSAsHTTPAPI('SHARE_FILE', { path }) as GeneralResponse
  }

  async ratingRequest(onlyFirst = true) {
    return await this.callIOSAsHTTPAPI('RATING_REQUEST', { onlyFirst })
  }

  async addWaterMark2Img(url: string, type: string, quality?: number) {
    const WATER_MARK = new URL(
      '../../../../packages/vivi-lib/src/assets/icon/cm/charmix-logo.svg',
      import.meta.url,
    ).href
    return new Promise<string>((resolve) => {
      const loadImgCb = (img: HTMLImageElement) => {
        imageUtils.imgLoadHandler(WATER_MARK, (watermark: HTMLImageElement) => loadWatermarkCb(img, watermark))
      }

      const loadWatermarkCb = (img: HTMLImageElement, watermark: HTMLImageElement) => {
        const width = img.naturalWidth
        const height = img.naturalHeight
        imageShadowPanelUtils.svgImageSizeFormatter(watermark, Math.min(width, height) / 2, () => resizeWatermarkCb(img, watermark, width, height))
      }

      const resizeWatermarkCb = (img: HTMLImageElement, watermark: HTMLImageElement, width: number, height: number) => {
        watermark.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          ctx?.drawImage(watermark, width - watermark.width - 50, height - watermark.height - 50, watermark.width, watermark.height)
          resolve(canvas.toDataURL(type, quality))
        }
      }

      imageUtils.imgLoadHandler(url, loadImgCb)
    })
  }

  showUpdateModal(force = false) {
    let locale = this.getUserInfoFromStore().locale
    if (!['us', 'tw', 'jp'].includes(locale)) {
      locale = 'us'
    }
    const prefix = 'exp_' + locale + '_'
    const modalInfo = Object.fromEntries(Object.entries(store.getters['cmWV/getModalInfo']).map(
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
    }
    modalUtils.setModalInfo(
      modalInfo.title,
      modalInfo.msg,
      {
        msg: modalInfo.btn_txt,
        // class: 'btn-black-mid',
        // style: {
        //   color: '#F8F8F8'
        // },
        action: () => {
          const url = modalInfo.btn_url
          if (url) { window.open(url, '_blank') }
        }
      },
      {
        msg: modalInfo.btn2_txt || '',
        // class: 'btn-light-mid',
        // style: {
        //   border: 'none',
        //   color: '#474A57',
        //   backgroundColor: '#D3D3D3'
        // }
      },
      options
    )
  }
}

export default new CmWVUtils()
