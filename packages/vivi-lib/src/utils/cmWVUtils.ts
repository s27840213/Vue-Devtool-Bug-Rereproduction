import i18n from '@/i18n'
import { ICmProFeatures } from '@/interfaces/payment'
import store from '@/store'
import generalUtils from '@/utils/generalUtils'
import { IFullPagePaymentConfigParams } from '@/interfaces/fullPage'
import { HTTPLikeWebViewUtils } from '@/utils/nativeAPIUtils'
import { nextTick } from 'vue'

export interface IGeneralSuccessResponse {
  flag: '0'
}

export interface IGeneralFailureResponse {
  flag: string
  msg: string
}

type GeneralResponse = IGeneralSuccessResponse | IGeneralFailureResponse

export interface IUserInfo {
  hostId: string
  appVer: string
  osVer: string
  isFirstOpen: boolean
  statusBarHeight: number
  homeIndicatorHeight: number
  country: string
  modelName: string
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
  imageId?: string
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
    modelName: 'web',
  }

  CALLBACK_MAPS = {}

  tutorialFlags = {} as { [key: string]: boolean }

  get inBrowserMode() {
    return store.getters['cmWV/getInBrowserMode']
  }

  get isDuringCopy() {
    return store.getters['cmWV/getIsDuringCopy']
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

  async getUserInfo(): Promise<IUserInfo> {
    if (this.inBrowserMode) return this.DEFAULT_USER_INFO
    const userInfo = await this.callIOSAsHTTPAPI('APP_LAUNCH', this.getEmptyMessage())
    return userInfo as IUserInfo
  }

  async getAlbumList(): Promise<IAlbumListResponse> {
    const albumList = await this.callIOSAsHTTPAPI('GET_ALBUM_LIST', this.getEmptyMessage())

    return albumList as IAlbumListResponse
  }

  async getAlbumContent(albumId: string, pageIndex: number): Promise<IAlbumContentResponse> {
    const albumList = await this.callIOSAsHTTPAPI('GET_ALBUM_CONTENT', {
      albumId,
      pageIndex,
    })

    return albumList as IAlbumContentResponse
  }

  async saveAssetFromUrl(type: 'gif' | 'jpg' | 'png' | 'mp4', url: string, options?: { key?: string, subPath?: string, name?: string }): Promise<ISaveAssetFromUrlResponse> {
    return this.callIOSAsHTTPAPI('SAVE_FILE_FROM_URL', { type, url, ...options }) as Promise<ISaveAssetFromUrlResponse>
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

  async copyEditor(pageSize: { width: number, height: number }, noBg = false): Promise<{flag: string, cleanup: () => void, imageId: string}> {
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

  async sendCopyEditor(pageSize: { width: number, height: number }): Promise<{flag: string, cleanup: () => void, imageId: string}> {
    const imageId = generalUtils.generateAssetId()
    const { flag, cleanup } = await this.sendCopyEditorCore('editorSave', pageSize, imageId)
    return {
      flag,
      cleanup,
      imageId
    }
  }

  async sendCopyEditorCore(action: 'editorSave', pageSize: { width: number, height: number }, imageId: string, imagePath?: string): Promise<{flag: string, cleanup: () => void}>
  async sendCopyEditorCore(action: 'editorDownload', pageSize: { width: number, height: number }): Promise<{flag: string, cleanup: () => void}>
  async sendCopyEditorCore(action: 'editorSave' | 'editorDownload', pageSize: { width: number, height: number }, imageId?: string, imagePath?: string): Promise<{flag: string, cleanup: () => void}> {
    if (this.inBrowserMode) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        flag: '0',
        cleanup: () => { console.log('empty cleanup') }
      }
    }
    const { x, y, width, height } = this.getEditorDimensions(pageSize)
    const data = await this.callIOSAsHTTPAPI('SCREENSHOT', {
      action,
      width,
      height,
      x,
      y,
      ...(imageId && { imageId }),
      ...(imagePath && { imagePath }),
    }, { timeout: -1 }) as GeneralResponse | null | undefined
    return {
      flag: (data?.flag as string) ?? '0',
      cleanup: () => {
        if (action !== 'editorSave') return
        this.deleteFile('screenshot', imageId ?? '', 'png', imagePath)
      }
    }
  }

  getEditorDimensions(pageSize: { width: number, height: number }): { x: number; y: number; width: number; height: number } {
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

  async getState(key: string): Promise<any | undefined> {
    if (this.inBrowserMode) return
    const data = await this.callIOSAsHTTPAPI('GET_STATE', { key }) as IGetStateResponse
    return data.value ? JSON.parse(data.value) : undefined
  }

  async setState(key: string, value: any) {
    if (this.inBrowserMode) return
    await this.callIOSAsHTTPAPI('SET_STATE', { key, value })
  }

  async deleteFile(key: string, name: string, type: string, subPath?: string) {
    if (this.inBrowserMode) return
    await this.callIOSAsHTTPAPI('DELETE_FILE', { key, name, type, subPath })
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

  openPayment(target?: ICmProFeatures) {
    const params = {
      target,
      theme: 'cm',
      carouselItems: [
        {
          key: 'powerful-fill',
          title: 'Powerful Fill',
          img: require('@img/png/pricing/cm-pro.png')
        },
      ],
      cards: [
        {
          iconName: 'unlimited',
          title: 'Unlimited creation'
        },
        {
          iconName: 'watermark',
          title: 'Watermark free'
        },
        {
          iconName: 'backward',
          title: 'Fast image processing'
        }
      ],
      btnPlans: [
        {
          key: 'annually',
          title: i18n.global.t('NN0515'),
          subTitle: '',
          price: store.getters['payment/getPayment'].prices.annually.text
        },
        {
          key: 'monthly',
          title: i18n.global.t('NN0514'),
          subTitle: '',
          price: store.getters['payment/getPayment'].prices.monthly.text
        }
      ],
      comparisons: [],
      termsOfServiceUrl: '',
      privacyPolicyUrl: '',
      defaultTrialToggled: false,
      isPromote: false
    } as IFullPagePaymentConfigParams
    store.commit('SET_fullPageConfig', { type: 'payment', params })
  }

  async setDefaultPrices() {
    // TODO: update prices
    store.commit('payment/SET_paymentPending', { info: false })
  }
}

export default new CmWVUtils()
