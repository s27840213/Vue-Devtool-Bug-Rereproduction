import VueRouter from 'vue-router'
import { IUserDesignContentData, IUserFolderContentData } from '@/interfaces/api'
import { IDesign, IFolder, IPathedFolder } from '@/interfaces/design'
import designApis from '@/apis/design'
import router from '@/router'
import store from '@/store'
import assetUtils from './assetUtils'
import generalUtils from './generalUtils'
import pageUtils from './pageUtils'
import themeUtils from './themeUtils'
import uploadUtils from './uploadUtils'
import resizeUtils from './resizeUtils'
import { nextTick } from 'vue'
import i18n from '@/i18n'
import stepsUtils from './stepsUtils'
import _ from 'lodash'
import { EventEmitter } from 'events'
import unitUtils from './unitUtils'

interface Item {
  name: string,
  lastUpdatedTime: string
}

const _DESIGN_MENU_EVENTS = [
  'deleteItem', 'deleteForever',
  'recoverItem', 'moveDesignToFolder', 'downloadDesign',
  'favorDesign', 'unfavorDesign', 'rootDesign'
] as const

export type IDesignMenuEvents = typeof _DESIGN_MENU_EVENTS[number]

export function DESIGN_MENU_EVENTS(): typeof _DESIGN_MENU_EVENTS {
  return _DESIGN_MENU_EVENTS
}

const _FOLDER_MENU_EVENTS = ['deleteFolderForever', 'recoverItem'] as const

export type IFolderMenuEvents = typeof _FOLDER_MENU_EVENTS[number]

export function FOLDER_MENU_EVENTS(): typeof _FOLDER_MENU_EVENTS {
  return _FOLDER_MENU_EVENTS
}

class DesignUtils {
  ROOT = '$ROOT$'
  event = new EventEmitter()
  eventHash: { [key: string]: () => void } = {}
  get isLogin(): boolean { return store.getters['user/isLogin'] }
  get teamId(): string { return store.getters['user/getTeamId'] }
  get ROOT_DISPLAY(): string { return i18n.global.t('NN0187') }

  on(type: string, callback: () => void) {
    if (this.eventHash[type]) {
      this.event.off(type, this.eventHash[type])
      delete this.eventHash[type]
    }
    this.event.on(type, callback)
    this.eventHash[type] = callback
  }

  off(type: string) {
    if (this.eventHash[type]) {
      this.event.off(type, this.eventHash[type])
      delete this.eventHash[type]
    }
  }

  emit(type: string) {
    this.event.emit(type)
  }

  apiDesign2IDesign(design: IUserDesignContentData): IDesign {
    return {
      id: design.id,
      asset_index: design.asset_index,
      name: design.name,
      width: design.width,
      height: design.height,
      unit: design.unit,
      createdTime: design.create_time,
      lastUpdatedTime: design.update_time,
      favorite: design.favorite > 0,
      ver: design.ver,
      thumbnail: '',
      signedUrl: design.signed_url,
      pageNum: design.page_num,
      polling: design.polling
    }
  }

  apiFolder2IFolder(folder: IUserFolderContentData): IFolder {
    return {
      id: folder.id,
      name: folder.name,
      createdTime: folder.create_time,
      lastUpdatedTime: folder.update_time,
      author: folder.author,
      subFolders: [],
      isExpanded: false,
      isCurrLocation: false
    }
  }

  updateFolders(currentFolders: IFolder[], newFolders: IFolder[]) {
    const countMap = {} as { [key: string]: { seen: boolean, folder: IFolder } }
    const indicesToDelete = []
    for (const folder of newFolders) {
      countMap[folder.id] = {
        seen: false,
        folder
      }
    }
    for (const [i, folder] of currentFolders.entries()) {
      if (countMap[folder.id] !== undefined) {
        countMap[folder.id].seen = true
        if (countMap[folder.id].folder.name !== folder.name) {
          folder.name = countMap[folder.id].folder.name
        }
      } else {
        indicesToDelete.unshift(i)
      }
    }
    for (const index of indicesToDelete) {
      currentFolders.splice(index, 1)
    }
    for (const { seen, folder } of Object.values(countMap)) {
      if (!seen) {
        currentFolders.push(folder)
      }
    }
    return currentFolders
  }

  getInsertIndex<T extends Item>(items: T[], sortByField: string, sortByDescending: boolean, item: T): number {
    const modifier = sortByDescending ? -1 : 1
    const compareFunction = sortByField === 'name' ? (item2: T): boolean => {
      return item2.name.localeCompare(item.name) * modifier > 0
    } : (item2: T): boolean => {
      return (Date.parse(item2.lastUpdatedTime) - Date.parse(item.lastUpdatedTime)) * modifier > 0
    }
    const index = items.findIndex(compareFunction)
    return index >= 0 ? index : items.length
  }

  sortByCreateTime(folders: IFolder[]): IFolder[] {
    folders.sort((a, b) => {
      return (Date.parse(b.createdTime) - Date.parse(a.createdTime))
    })
    return folders
  }

  newFolder(name: string, author: string, randomTime = false, isROOT = false): IFolder {
    const time = randomTime ? new Date(generalUtils.generateRandomTime(new Date(2021, 1, 1), new Date())).toISOString() : new Date().toISOString()
    return {
      id: isROOT ? this.ROOT : generalUtils.generateAssetId() + '_new',
      name,
      author,
      createdTime: time,
      lastUpdatedTime: time,
      isExpanded: false,
      isCurrLocation: false,
      subFolders: []
    }
  }

  newFolders(fullpath: string, author: string): IFolder {
    const path = fullpath.split('/')
    const res = this.newFolder(path[0], author)
    let currentFolder = res
    for (let i = 1; i < path.length; i++) {
      currentFolder.subFolders.push(this.newFolder(path[i], author, true))
      currentFolder = currentFolder.subFolders[0]
    }
    return res
  }

  makeDesignsForTesting(): IFolder[] {
    const template: IFolder[] = []
    template[0] = this.newFolder(this.ROOT, 'SYSTEM', true, true)
    template[0].subFolders = [
      this.newFolders('Toby/素材2/材質3/材質4/材質5', 'Daniel'),
      this.newFolder('日本行銷', 'Daniel', true)
    ]
    // for (let i = 0; i < 15; i++) {
    //   const time = new Date(generalUtils.generateRandomTime(new Date(2021, 1, 1), new Date())).toISOString()
    //   template[0].subFolders[0].designs.push({
    //     name: `Name${i + 1}`,
    //     width: 1200,
    //     height: 1200,
    //     id: generalUtils.generateAssetId(),
    //     thumbnail: require(`@/assets/img/png/mydesign/sample${i + 1}.png`),
    //     createdTime: time,
    //     lastUpdatedTime: time,
    //     favorite: false,
    //     ver: 0
    //   })
    // }
    return template
  }

  initializeFolders(): IFolder[] {
    return [this.newFolder(this.ROOT, 'SYSTEM', true, true)]
  }

  makePath(selectInfo: string): string[] {
    return selectInfo.substring(2).split('/')
  }

  appendPath(parents: string[], folder: IFolder): string[] {
    return [...parents, folder.id]
  }

  createPath(pathedFolder: IPathedFolder): string[] {
    return this.appendPath(pathedFolder.parents, pathedFolder.folder)
  }

  makeNormalMenuItems(): { icon: string, text: string, extendable?: boolean }[] {
    return [
      {
        icon: 'copy',
        text: `${i18n.global.t('NN0251')}`
      },
      {
        icon: 'folder',
        text: `${i18n.global.t('NN0206')}`,
        extendable: true
      },
      {
        icon: 'trash',
        text: `${i18n.global.t('NN0034')}`
      }
    ]
    // ,
    // {
    //   icon: 'share-alt',
    //   text: '分享'
    // },
    // {
    //   icon: 'download',
    //   text: '下載'
    // }
  }

  makeFavoriteMenuItems(): { icon: string, text: string, extendable?: boolean }[] {
    return [
      {
        icon: 'trash',
        text: `${i18n.global.t('NN0034')}`
      }
    ]
    // {
    //   icon: 'share-alt',
    //   text: `${useI18n().t('NN0214')}`
    // },
    // {
    //   icon: 'download',
    //   text: `${useI18n().t('NN0010')}`
    // },
  }

  makeTrashMenuItems(): { icon: string, text: string }[] {
    return [
      {
        icon: 'reduction',
        text: `${i18n.global.t('NN0204')}`
      },
      {
        icon: 'trash',
        text: `${i18n.global.t('NN0200')}`
      }
    ]
  }

  makeMobileNormalMenuItems(isInFavorites: boolean, isInFolderView: boolean): { icon: string, text: string }[] {
    const res = [
      {
        icon: 'copy',
        text: `${i18n.global.t('NN0251')}`
      },
      {
        icon: 'folder',
        text: `${i18n.global.t('NN0206')}`
      },
      {
        icon: isInFavorites ? 'favorites-fill' : 'favorites',
        text: isInFavorites ? `${i18n.global.t('NN0207')}` : `${i18n.global.t('NN0205')}`
      },
      {
        icon: 'confirm-circle',
        text: `${i18n.global.t('NN0680')}`
      },
      {
        icon: 'trash',
        text: `${i18n.global.t('NN0034')}`
      }
    ]
    if (isInFolderView) {
      res.splice(2, 0, {
        icon: 'folder_minus',
        text: `${i18n.global.t('NN0692')}`
      })
    }
    return res
  }

  makeMobileFavoriteMenuItems(): { icon: string, text: string }[] {
    return [
      {
        icon: 'favorites-fill',
        text: `${i18n.global.t('NN0207')}`
      },
      {
        icon: 'confirm-circle',
        text: `${i18n.global.t('NN0680')}`
      },
      {
        icon: 'trash',
        text: `${i18n.global.t('NN0034')}`
      }
    ]
  }

  makeMobileTrashMenuItems(): { icon: string, text: string }[] {
    return [
      {
        icon: 'undo',
        text: `${i18n.global.t('NN0204')}`
      },
      {
        icon: 'confirm-circle',
        text: `${i18n.global.t('NN0680')}`
      },
      {
        icon: 'trash',
        text: `${i18n.global.t('NN0200')}`
      }
    ]
  }

  makeMobileNormalFolderMenuItems(isInFolderView: boolean): { icon: string, text: string }[] {
    const res = [
      {
        icon: 'folder',
        text: `${i18n.global.t('NN0206')}`
      },
      {
        icon: 'trash',
        text: `${i18n.global.t('NN0034')}`
      }
    ]
    if (isInFolderView) {
      res.splice(1, 0, {
        icon: 'folder_minus',
        text: `${i18n.global.t('NN0692')}`
      })
    }
    return res
  }

  makeMobileTrashFolderMenuItems(): { icon: string, text: string }[] {
    return [
      {
        icon: 'undo',
        text: `${i18n.global.t('NN0204')}`
      },
      {
        icon: 'confirm-circle',
        text: `${i18n.global.t('NN0690')}`
      },
      {
        icon: 'trash',
        text: `${i18n.global.t('NN0200')}`
      }
    ]
  }

  findFolder(folders: IFolder[], id: string): IFolder | undefined {
    for (const folder of folders) {
      if (folder.id === id) {
        return folder
      }
    }
  }

  findFolders(folders: IFolder[], id: string): IFolder[] {
    for (const folder of folders) {
      if (folder.id === id) {
        return folder.subFolders
      }
    }
    return []
  }

  search(folders: IFolder[], path: string[]): IFolder | undefined {
    if (path.length === 0) return undefined
    const parents = path.slice(0, path.length - 1)
    const id = path[path.length - 1]

    let currentFolders = folders
    for (const parent of parents) {
      currentFolders = this.findFolders(currentFolders, parent)
    }
    return this.findFolder(currentFolders, id)
  }

  goTo(folders: IFolder[], path: string[]): IFolder[] {
    let currentFolders = folders
    for (const node of path) {
      currentFolders = this.findFolders(currentFolders, node)
    }
    return currentFolders
  }

  getFolderNames(folders: IFolder[], path: string[]): string[] {
    const res = []
    let currentFolders = folders
    for (const node of path) {
      const currentFolder = this.findFolder(currentFolders, node)
      if (!currentFolder) break
      res.push(currentFolder.name)
      currentFolders = currentFolder.subFolders
    }
    return res
  }

  dislocateFrom(folders: IFolder[], selectInfo: string) {
    if (selectInfo.startsWith('f')) { // f:Toby/素材/材質
      const targetFolder = this.search(folders, this.makePath(selectInfo))
      if (targetFolder) {
        targetFolder.isCurrLocation = false
      }
    }
  }

  locateTo(folders: IFolder[], selectInfo: string) {
    if (selectInfo.startsWith('f')) { // f:Toby/素材/材質
      const targetFolder = this.search(folders, this.makePath(selectInfo))
      if (targetFolder) {
        targetFolder.isCurrLocation = true
      }
    }
  }

  isParentOrEqual(a: IPathedFolder, b: IPathedFolder): boolean {
    const aFullPath = this.createPath(a).join('/')
    const bFullPath = this.createPath(b).join('/')
    return bFullPath.startsWith(aFullPath)
  }

  dispatchDesignMenuAction(icon: string, design: IDesign, eventEmitter: (extraEvent?: { event: string, payload: any }) => void) {
    switch (icon) {
      case 'copy': {
        store.dispatch('design/copyDesign', design).then(() => {
          eventEmitter()
        })
        break
      }
      case 'trash': {
        this.delete(design)
        eventEmitter({
          event: 'deleteItem',
          payload: {
            type: 'design',
            data: design,
            dest: store.getters['design/getCurrLocation']
          }
        })
        break
      }
      case 'delete': {
        eventEmitter({
          event: 'deleteForever',
          payload: design
        })
        break
      }
      case 'reduction': {
        this.recover(design).then((dest) => {
          if (dest === '') return
          eventEmitter({
            event: 'recoverItem',
            payload: {
              type: 'design',
              data: design,
              dest
            }
          })
        })
        break
      }
      case 'undo': {
        this.recover(design)
        eventEmitter({
          event: 'recoverItem',
          payload: {
            type: 'design',
            data: design
          }
        })
        break
      }
      case 'folder': {
        eventEmitter({
          event: 'moveDesignToFolder',
          payload: design
        })
        break
      }
      case 'download': {
        eventEmitter({
          event: 'downloadDesign',
          payload: design
        })
        break
      }
      case 'favorites': {
        this.addToFavorite(design)
        eventEmitter({
          event: 'favorDesign',
          payload: design
        })
        break
      }
      case 'favorites-fill': {
        this.removeFromFavorite(design)
        eventEmitter({
          event: 'unfavorDesign',
          payload: design
        })
        break
      }
      case 'confirm-circle': {
        store.commit('design/UPDATE_addToSelection', design)
        eventEmitter()
        break
      }
      case 'folder_minus': {
        this.move(design, [this.ROOT])
        eventEmitter({
          event: 'rootDesign',
          payload: undefined
        })
        break
      }
    }
  }

  dispatchFolderMenuAction(icon: string, folder: IFolder, eventEmitter: (extraEvent?: { event: string, payload: any }) => void) {
    switch (icon) {
      case 'delete': {
        eventEmitter({
          event: 'deleteFolderForever',
          payload: folder
        })
        break
      }
      case 'undo': {
        this.recoverFolder(folder)
        eventEmitter({
          event: 'recoverItem',
          payload: {
            type: 'folder',
            data: folder
          }
        })
        break
      }
      case 'reduction': {
        this.recoverFolder(folder).then((dest) => {
          if (dest === '') return
          eventEmitter({
            event: 'recoverItem',
            payload: {
              type: 'folder',
              data: folder,
              dest
            }
          })
        })
        break
      }
    }
  }

  dispatchMobileFolderMenuAction(icon: string, pathedFolder: IPathedFolder, eventEmitter: (extraEvent?: { event: string, payload: any }) => void) {
    switch (icon) {
      case 'folder': {
        eventEmitter({
          event: 'moveDesignToFolder',
          payload: undefined
        })
        break
      }
      case 'trash': {
        this.checkEmpty(pathedFolder).then((empty) => {
          if (empty) {
            this.deleteFolder(pathedFolder)
            eventEmitter({
              event: 'deleteItem',
              payload: {
                type: 'folder',
                data: pathedFolder.folder
              }
            })
          } else {
            eventEmitter({
              event: 'deleteFolder',
              payload: pathedFolder
            })
          }
        })
        break
      }
      case 'confirm-circle': {
        store.commit('design/UPDATE_addFolderToSelection', pathedFolder.folder)
        eventEmitter()
        break
      }
      case 'folder_minus': {
        this.moveFolder(pathedFolder, [this.ROOT])
        eventEmitter({
          event: 'rootFolder',
          payload: undefined
        })
        break
      }
      default:
        this.dispatchFolderMenuAction(icon, pathedFolder.folder, eventEmitter)
    }
  }

  addNewFolder(path: string[], fromFolderView = false, name: string | undefined = undefined, insertToCopied = false): string {
    const folder = this.newFolder(name ?? `${i18n.global.t('NN0249')}`, 'SYSTEM')
    store.commit('design/UPDATE_insertFolder', {
      parents: path,
      folder
    })
    if (insertToCopied) {
      store.commit('design/UPDATE_insertFolderToCopied', {
        parents: path.slice(1),
        folder
      })
    }
    if (fromFolderView) {
      store.commit('design/UPDATE_addFolder', folder)
    }
    return folder.id
  }

  move(design: IDesign, destination: string[]) {
    store.dispatch('design/moveDesign', {
      design,
      destination
    })
  }

  moveAll(designs: IDesign[], destination: string[]) {
    store.dispatch('design/moveDesigns', {
      designs,
      destination
    })
  }

  async moveFolder(pathedFolder: IPathedFolder, destination: string[]) {
    await store.dispatch('design/moveFolder', {
      parents: pathedFolder.parents,
      folder: pathedFolder.folder,
      destination
    })
  }

  delete(design: IDesign) {
    store.dispatch('design/deleteDesign', design)
  }

  deleteAll(designs: IDesign[]) {
    store.dispatch('design/deleteDesigns', designs)
  }

  async deleteFolder(pathedFolder: IPathedFolder) {
    await store.dispatch('design/deleteFolder', pathedFolder)
  }

  deleteForever(design: IDesign) {
    store.dispatch('design/deleteDesignForever', design)
  }

  deleteAllForever(designs: IDesign[], folders: IFolder[]) {
    store.dispatch('design/deleteAllForever', { designs, folders })
  }

  deleteFolderForever(folder: IFolder) {
    store.dispatch('design/deleteFolderForever', folder)
  }

  async recover(design: IDesign, deletionLocation?: string): Promise<string> {
    return await store.dispatch('design/recoverDesign', { design, deletionLocation })
  }

  async recoverAll(designs: IDesign[], folders: IFolder[]): Promise<string> {
    return await store.dispatch('design/recoverAll', { designs, folders })
  }

  async recoverFolder(folder: IFolder, deletionLocation?: string): Promise<string> {
    return await store.dispatch('design/recoverFolder', { folder, deletionLocation })
  }

  removeFromFavorite(design: IDesign) {
    store.dispatch('design/unfavorDesign', design)
  }

  removeAllFromFavorite(designs: IDesign[]) {
    store.dispatch('design/unfavorDesigns', designs)
  }

  addToFavorite(design: IDesign) {
    store.dispatch('design/favorDesign', design)
  }

  addAllToFavorite(designs: IDesign[]) {
    store.dispatch('design/favorDesigns', designs)
  }

  setDesignName(design: IDesign, name: string) {
    store.dispatch('design/setDesignName', { design, name })
  }

  setFolderName(folder: IFolder, name: string, parents: string[]) {
    store.dispatch('design/setFolderName', { folder, name, parents })
  }

  createFolder(parents: string[], folder: IFolder, name: string) {
    store.dispatch('design/createFolder', {
      path: parents.slice(1).join(','),
      folder,
      name
    })
  }

  async checkEmpty(pathedFolder: IPathedFolder): Promise<boolean> {
    return await store.dispatch('design/checkEmpty', pathedFolder)
  }

  isMaxLevelReached(level: number) {
    return level >= 4
  }

  async fetchDesign(teamId: string, assetId: string, params?: { [index: string]: any }) {
    const designData = await store.dispatch('design/fetchDesign', { teamId, assetId })
    store.commit('SET_folderInfo', {
      isRoot: designData.is_root,
      parentFolder: designData.parent_folder,
      path: designData.path
    })
    store.commit('SET_pagesName', designData.name)
    store.commit('SET_assetIndex', designData.asset_index)
    await uploadUtils.getDesign('design', { designId: assetId, teamId, fetchTarget: designData.url_map['config.json'] }, params)
  }

  fetchDesigns(fetcher: () => Promise<void>, clear = true) {
    if (clear) {
      store.commit('design/SET_allDesigns', [])
    }
    store.commit('design/SET_isDesignsLoading', true)
    fetcher().then(() => {
      store.commit('design/SET_isDesignsLoading', false)
    })
  }

  fetchFolders(fetcher: () => Promise<void>) {
    store.commit('design/SET_allFolders', [])
    store.commit('design/SET_isFoldersLoading', true)
    fetcher().then(() => {
      store.commit('design/SET_isFoldersLoading', false)
    })
  }

  getDesignPreview(assetId: string | undefined, scale = 2 as 1 | 2 | 4, ver?: number, signedUrl?: { [key: string]: string }, page = 0): string {
    const prevImageName = `${page}_prev${scale === 1 ? '' : `_${scale}x`}`
    const verstring = ver?.toString() ?? generalUtils.generateRandomString(6)
    if (assetId !== undefined) {
      const previewUrl = `https://template.vivipic.com/${uploadUtils.loginOutput.upload_map.path}asset/design/${assetId}/${prevImageName}?ver=${verstring}`
      return previewUrl
    } else {
      if (signedUrl) return signedUrl[prevImageName] + `&ver=${verstring}`
      return '' // theoretically never reach here because either assestId or signedUrl will be non-undefined
    }
  }

  getDesignPreviews(pageNum: number, assetId: string | undefined, scale = 2 as 1 | 2, ver?: number, signedUrl?: { '0_prev': string, '0_prev_2x': string }): string[] {
    return Array(pageNum).fill('').map((_, index) => this.getDesignPreview(assetId, scale, ver, signedUrl, index))
  }

  newDesignWithLoginRedirect(width: number | string = 1080, height: number | string = 1080, unit = 'px', id: number | string | undefined = undefined, path?: string, folderName?: string) {
    // Redirect user to editor and create new design, will be use by login redirect.
    const query = {
      type: 'new-design-size',
      width: width.toString(),
      height: id?.toString() === '7' ? width.toString() : height.toString(),
      unit,
      themeId: id ? id.toString() : undefined,
      path,
      folderName
    }
    router.push({ name: 'Editor', query })
  }

  // Below function is used to update the page
  // async newDesign(width?: number, height?: number, newDesignType?: number, path?: string, folderName?: string, to?: VueRouter.RouteLocationNormalized) {
  async newDesign(width = 1080, height = 1080, unit = 'px', newDesignType?: number, path?: string, folderName?: string, to?: VueRouter.RouteLocationNormalized) {
    store.commit('file/SET_setLayersDone')
    const pxSize = unitUtils.convertSize(width, height, unit, 'px')
    const inSize = unitUtils.convertSize(width, height, unit, 'in')

    // get default bleeds with page dpi
    const dpi = {
      width: pxSize.width / inSize.width,
      height: pxSize.height / inSize.height
    }
    const bleeds = pageUtils.getDefaultBleeds('px', dpi)

    pageUtils.setPages([pageUtils.newPage({
      width: pxSize.width,
      height: pxSize.height,
      physicalWidth: width,
      physicalHeight: height,
      bleeds,
      physicalBleeds: unit === 'px' ? bleeds : pageUtils.getDefaultBleeds(unit, dpi),
      unit
    })])
    pageUtils.clearPagesInfo()
    await themeUtils.refreshTemplateState(undefined, newDesignType)

    // if (this.isLogin) {
    //   router.replace({
    //     query: { width: width?.toString(), height: height?.toString(), ...(path && { path }), ...(folderName && { folderName }) },
    //     path: to?.path ?? router.currentRoute.value.path
    //   })
    if (this.isLogin) {
      const query = router.currentRoute.value.query
      query.width = width.toString()
      query.height = height.toString()
      query.unit = unit
      if (path) query.path = path
      if (folderName) query.folderName = folderName
      router.push({
        query,
        path: to?.path ?? router.currentRoute.value.path
      })
    }
  }

  newDesignWithTemplae(width: number, height: number, json: any, templateId: string, groupId: string) {
    console.log(json)
    assetUtils.addTemplateToRecentlyUsedPure(templateId).then(() => {
      assetUtils.addTemplate(json, {}, false).then(() => {
        stepsUtils.reset()
        pageUtils.clearPagesInfo()
        nextTick(() => {
          resizeUtils.resizePage(0, json, { width, height })
          store.commit('UPDATE_pageProps', {
            pageIndex: 0,
            props: { width, height }
          })
          themeUtils.refreshTemplateState()
          if (this.isLogin) {
            /**
             * @Note using "router.replace" instead of "router.push" to prevent from adding a new history entry
             */
            store.commit('SET_assetId', generalUtils.generateAssetId())
            // eslint-disable-next-line camelcase
            const query = _.omit(router.currentRoute.value.query,
              ['width', 'height'])
            query.type = 'design'
            query.design_id = uploadUtils.assetId
            query.team_id = uploadUtils.teamId

            router.replace({ query }).then(() => {
              uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH)
            })
          }
        })
      })
    })
  }

  setDesign(design: IDesign) {
    const design_id = design.id ? design.id : this.getPrivateDesignId(design.signedUrl?.['config.json'])
    router.push({ name: 'Editor', query: { type: 'design', design_id, team_id: this.teamId } })
  }

  getPrivateDesignId(jsonUrl?: string): string {
    return (jsonUrl ?? '').match(/design\/(.*)\/config\.json/)?.[1] ?? ''
  }

  getDesignName(): string {
    return store.getters.getPagesName
  }

  async renameDesign(name: string) {
    if (!store.getters.getAssetId) {
      await uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH)
    }
    let assetIndex = store.getters.getAssetIndex
    if (assetIndex === -1) {
      const teamId = designApis.getTeamId()
      const assetId = store.getters.getAssetId
      const designData = await store.dispatch('design/fetchDesign', { teamId, assetId })
      assetIndex = designData.asset_index
      store.commit('SET_assetIndex', assetIndex)
    }
    await designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getTeamId(),
      'rename', assetIndex.toString(), null, name)
    store.commit('SET_pagesName', name)
  }
}

export default new DesignUtils()
