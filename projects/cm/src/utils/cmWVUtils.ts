import { useEditorStore } from '@/stores/editor'
import { useGlobalStore } from '@/stores/global'
import { useWebViewStore } from '@/stores/webView'
import { generalUtils, nativeAPIUtils } from '@nu/shared-lib'
import { storeToRefs } from 'pinia'

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

export interface IAlbumContentResponse {
  flag: number
  msg?: string
  content: string[]
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

class WebViewUtils extends nativeAPIUtils<IUserInfo> {
  STANDALONE_USER_INFO: IUserInfo = {
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

  getUserInfoFromStore(): IUserInfo {
    return this.STANDALONE_USER_INFO
  }

  get globalStore() {
    return storeToRefs(useGlobalStore())
  }

  get webViewStore() {
    return storeToRefs(useWebViewStore())
  }

  get isStandaloneMode() {
    const { standaloneMode } = this.globalStore
    return standaloneMode.value
  }

  get isDuringCopy() {
    const { isDuringCopy } = this.webViewStore
    return isDuringCopy.value
  }

  setDuringCopy(bool: boolean) {
    const { setDuringCopy } = useWebViewStore()
    setDuringCopy(bool) 
  }

  detectIfInApp() {
    if (window.webkit?.messageHandlers?.REQUEST === undefined) {
      this.enterStandaloneMode()
    }
  }

  enterStandaloneMode() {
    const globalStore = useGlobalStore()
    const { setStandaloneMode } = globalStore
    setStandaloneMode(true)
  }

  async getUserInfo(): Promise<IUserInfo> {
    if (this.isStandaloneMode) return this.STANDALONE_USER_INFO
    const userInfo = await this.callIOSAsAPI('APP_LAUNCH', this.getEmptyMessage())
    return userInfo as IUserInfo
  }

  async getAlbumList(): Promise<IAlbumListResponse> {
    const albumList = await this.callIOSAsAPI('GET_ALBUM_LIST', this.getEmptyMessage())

    return albumList as IAlbumListResponse
  }

  async getAlbumContent(albumId: string, pageIndex: number): Promise<IAlbumContentResponse> {
    const albumList = await this.callIOSAsAPI('GET_ALBUM_CONTENT', {
      albumId,
      pageIndex,
    })

    return albumList as IAlbumContentResponse
  }

  async switchDomain(url: string): Promise<void> {
    await this.callIOSAsAPI('SWITCH_DOMAIN', {
      url,
    })
  }

  async copyEditorCore(sender: () => Promise<{flag: string, imageId: string}>) {
    return new Promise<{flag: string, imageId: string}>(resolve => {
      const executor = () => {
        nextTick(() => {
          this.preCopyEditor()
          setTimeout(() => {
            sender().then(({ flag, imageId }) => {
              this.postCopyEditor()
              resolve({ flag, imageId })
            })
          }, 500) // wait for soft keyboard to close
        })
      }
      executor()
    })
  }

  async copyEditor(): Promise<{flag: string, imageId: string}> {
    return await this.copyEditorCore(this.sendCopyEditor.bind(this))
  }

  preCopyEditor() {
    this.setDuringCopy(true)
  }

  postCopyEditor() {
    this.setDuringCopy(false)
  }

  async sendCopyEditor(): Promise<{flag: string, imageId: string}> {
    const imageId = generalUtils.generateAssetId()
    return {
      flag: await this.sendCopyEditorCore('editorSave', imageId),
      imageId
    }
  }

  async sendCopyEditorCore(action: 'editorSave', imageId: string, imagePath?: string): Promise<string>
  async sendCopyEditorCore(action: 'editorDownload'): Promise<string>
  async sendCopyEditorCore(action: 'editorSave' | 'editorDownload', imageId?: string, imagePath?: string): Promise<string> {
    if (this.isStandaloneMode) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return '0'
    }
    const { x, y, width, height } = this.getEditorDimensions()
    const data = await this.callIOSAsAPI('SCREENSHOT', {
      action,
      width,
      height,
      x,
      y,
      ...(imageId && { imageId }),
      ...(imagePath && { imagePath }),
    }, { timeout: -1 }) as GeneralResponse | null | undefined
    return (data?.flag as string) ?? '0'
  }

  getEditorDimensions(): { x: number; y: number; width: number; height: number } {
    const store = useEditorStore()
    const {pageScaleRatio, pageSize} = storeToRefs(store)
    const { width: pageWidth, height: pageHeight } = pageSize.value
    const editorEle = document.getElementById('screenshot-target') as HTMLElement
    const defaultDimensions = {
      x: 0,
      y: 0,
      width: pageWidth * pageScaleRatio.value,
      height: pageHeight * pageScaleRatio.value,
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

  async getState(key: string): Promise<IGetStateResponse | undefined> {
    if (this.isStandaloneMode) return
    return await this.callIOSAsAPI('GET_STATE', { key }) as IGetStateResponse
  }

  async setState(key: string, value: any) {
    if (this.isStandaloneMode) return
    await this.callIOSAsAPI('SET_STATE', { key, value })
  }

  async fetchTutorialFlags() {
    const res = await this.getState('tutorialFlags')
    this.tutorialFlags = res && res.value ? JSON.parse(res.value) : {}
  }

  async updateTutorialFlags(updateItem: { [key: string]: boolean }) {
    Object.assign(this.tutorialFlags, updateItem)
    await this.setState('tutorialFlags', this.tutorialFlags)
  }
}

export default new WebViewUtils()
