import { IListServiceContentDataItem, ILoginResult } from '@/interfaces/api'
import store from '@/store'
import generalUtils from '@/utils/generalUtils'
import { HTTPLikeWebViewUtils } from '@/utils/nativeAPIUtils'
import { notify } from '@kyvg/vue3-notification'
import { nextTick } from 'vue'
import assetUtils from './assetUtils'
import listApis from '@/apis/list'

export interface IGeneralSuccessResponse {
  flag: '0'
}

export interface IGeneralFailureResponse {
  flag: string
  msg: string
}

type GeneralResponse = IGeneralSuccessResponse | IGeneralFailureResponse

export type IUserInfo = {
  hostId: string
  appVer: string
  osVer: string
  isFirstOpen: boolean
  statusBarHeight: number
  homeIndicatorHeight: number
  country: string
  modelName: string,
  flag: string,
  locale: string,
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
  key: string
  assets: any[]
  nextPage: string
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
  }

  CALLBACK_MAPS = {}
  everEntersDebugMode = false
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

  addDesignDisabled() {
    return this.everEntersDebugMode || window.location.hostname !== 'cm.vivipic.com'
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
      { data: ILoginResult, flag: number, msg?: string }
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

  async getAlbumList(): Promise<IAlbumListResponse> {
    const albumList = await this.callIOSAsHTTPAPI('GET_ALBUM_LIST')

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
    let retryTimes = 0
    let result
    while (retryTimes < 3) {
      result = await (this.callIOSAsHTTPAPI('SAVE_FILE_FROM_URL', { type, url, ...options }, { timeout: -1 }) as Promise<ISaveAssetFromUrlResponse>)
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
    const data = await this.callIOSAsHTTPAPI('GET_STATE', { key }, { retry: true }) as IGetStateResponse
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

  async listAsset(key: string, group?: string): Promise<void> {
    if (this.inBrowserMode || !this.checkVersion('1.0.14')) return
    const res = await this.callIOSAsHTTPAPI('LIST_ASSET', { key, group })
    if (!res) return
    this.handleListAssetResult(res as IListAssetResponse)
  }

  async listMoreAsset(key: string, nextPage: number, group?: string): Promise<void> {
    if (this.inBrowserMode || !this.checkVersion('1.0.14')) return
    if (nextPage < 0) return
    const res = await this.callIOSAsHTTPAPI('LIST_ASSET', { key, group, pageIndex: nextPage })
    if (!res) return
    this.handleListAssetResult(res as IListAssetResponse)
  }

  handleListAssetResult(data: IListAssetResponse) {
    if (['color', 'backgroundColor', 'giphy'].includes(data.key)) {
      assetUtils.setRecentlyUsed(data.key, data.assets)
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

  async addAsset(key: string, asset: any, limit = 100, group?: string) {
    if (this.inBrowserMode) return
    if (this.checkVersion('1.0.14')) {
      await this.callIOSAsHTTPAPI('ADD_ASSET', { key, asset, limit, group })
    }
  }
}

export default new CmWVUtils()
