import store from '@/store'
import generalUtils from '@/utils/generalUtils'
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

  async saveAssetFromUrl(type: 'gif' | 'jpg' | 'png' | 'mp4', url: string): Promise<ISaveAssetFromUrlResponse> {
    return this.callIOSAsHTTPAPI('SAVE_FILE_FROM_URL', { type, url }) as Promise<ISaveAssetFromUrlResponse>
  }

  async switchDomain(url: string): Promise<void> {
    await this.callIOSAsHTTPAPI('SWITCH_DOMAIN', {
      url,
    })
  }

  async copyEditorCore(sender: (pageSize: { width: number, height: number }) => Promise<{flag: string, imageId: string}>, pageSize: { width: number, height: number }) {
    return new Promise<{flag: string, imageId: string}>(resolve => {
      const executor = () => {
        nextTick(() => {
          this.preCopyEditor()
          setTimeout(() => {
            sender(pageSize).then(({ flag, imageId }) => {
              this.postCopyEditor()
              resolve({ flag, imageId })
            })
          }, 500) // wait for soft keyboard to close
        })
      }
      executor()
    })
  }

  async copyEditor(pageSize: { width: number, height: number }): Promise<{flag: string, imageId: string}> {
    return await this.copyEditorCore(this.sendCopyEditor.bind(this), pageSize)
  }

  preCopyEditor() {
    this.setDuringCopy(true)
  }

  postCopyEditor() {
    this.setDuringCopy(false)
  }

  async sendCopyEditor(pageSize: { width: number, height: number }): Promise<{flag: string, imageId: string}> {
    const imageId = generalUtils.generateAssetId()
    return {
      flag: await this.sendCopyEditorCore('editorSave', pageSize, imageId),
      imageId
    }
  }

  async sendCopyEditorCore(action: 'editorSave', pageSize: { width: number, height: number }, imageId: string, imagePath?: string): Promise<string>
  async sendCopyEditorCore(action: 'editorDownload', pageSize: { width: number, height: number }): Promise<string>
  async sendCopyEditorCore(action: 'editorSave' | 'editorDownload', pageSize: { width: number, height: number }, imageId?: string, imagePath?: string): Promise<string> {
    if (this.inBrowserMode) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return '0'
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
    return (data?.flag as string) ?? '0'
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

  async getState(key: string): Promise<IGetStateResponse | undefined> {
    if (this.inBrowserMode) return
    return await this.callIOSAsHTTPAPI('GET_STATE', { key }) as IGetStateResponse
  }

  async setState(key: string, value: any) {
    if (this.inBrowserMode) return
    await this.callIOSAsHTTPAPI('SET_STATE', { key, value })
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

export default new CmWVUtils()
