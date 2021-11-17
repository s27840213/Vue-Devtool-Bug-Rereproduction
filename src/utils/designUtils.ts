import { IUserDesignContentData, IUserFolderContentData } from '@/interfaces/api'
import { IDesign, IFolder, IPathedFolder } from '@/interfaces/design'
import router from '@/router'
import store from '@/store'
import generalUtils from './generalUtils'
import pageUtils from './pageUtils'
import uploadUtils from './uploadUtils'

class DesignUtils {
  ROOT = '$ROOT$'
  ROOT_DISPLAY = '我所有的設計'
  get isLogin(): boolean { return store.getters['user/isLogin'] }

  apiDesign2IDesign(design: IUserDesignContentData): IDesign {
    return {
      id: design.id,
      asset_index: design.asset_index,
      name: design.name,
      width: design.width,
      height: design.height,
      createdTime: design.create_time,
      lastUpdatedTime: design.update_time,
      favorite: design.favorite > 0,
      ver: design.ver,
      thumbnail: ''
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
    const countMap = {} as {[key: string]: {seen: boolean, folder: IFolder}}
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

  getInsertIndex(designs: IDesign[], sortByField: string, sortByDescending: boolean, design: IDesign): number {
    const modifier = sortByDescending ? -1 : 1
    const compareFunction = sortByField === 'name' ? (design2: IDesign): boolean => {
      return design2.name.localeCompare(design.name) * modifier > 0
    } : (design2: IDesign): boolean => {
      return (Date.parse(design2.lastUpdatedTime) - Date.parse(design.lastUpdatedTime)) * modifier > 0
    }
    const index = designs.findIndex(compareFunction)
    return index >= 0 ? index : designs.length
  }

  newFolder(name: string, author: string, randomTime = false, isROOT = false): IFolder {
    const time = randomTime ? generalUtils.generateRandomTime(new Date(2021, 1, 1), new Date()) : Date.now()
    return {
      id: isROOT ? this.ROOT : generalUtils.generateAssetId(),
      name,
      author,
      createdTime: time.toString(),
      lastUpdatedTime: time.toString(),
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
    // template[0].subFolders = [
    //   this.newFolders('Toby/素材2/材質3/材質4/材質5', 'Daniel'),
    //   this.newFolder('日本行銷', 'Daniel', true)
    // ]
    // for (let i = 0; i < 15; i++) {
    //   const time = generalUtils.generateRandomTime(new Date(2021, 1, 1), new Date())
    //   template[0].subFolders[0].designs.push({
    //     name: `Name${i + 1}`,
    //     width: 1200,
    //     height: 1200,
    //     id: generalUtils.generateAssetId(),
    //     thumbnail: require(`@/assets/img/png/mydesign/sample${i + 1}.png`),
    //     createdTime: time.toString(),
    //     lastUpdatedTime: time.toString(),
    //     favorite: false,
    //     ver: 0
    //   })
    // }
    return template
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
        text: '建立副本'
      },
      {
        icon: 'share-alt',
        text: '分享'
      },
      {
        icon: 'download',
        text: '下載'
      },
      {
        icon: 'folder',
        text: '移至資料夾',
        extendable: true
      },
      {
        icon: 'trash',
        text: '刪除'
      }
    ]
  }

  makeFavoriteMenuItems(): { icon: string, text: string, extendable?: boolean }[] {
    return [
      {
        icon: 'share-alt',
        text: '分享'
      },
      {
        icon: 'download',
        text: '下載'
      },
      {
        icon: 'trash',
        text: '刪除'
      }
    ]
  }

  makeTrashMenuItems(): { icon: string, text: string }[] {
    return [
      {
        icon: 'reduction',
        text: '還原'
      },
      {
        icon: 'trash',
        text: '永久刪除'
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

  foldAll(folders: IFolder[]): IFolder[] {
    const nodes = [...folders]
    while (nodes.length > 0) {
      const node = nodes.shift()
      if (node) {
        node.isExpanded = false
        node.isCurrLocation = false
        for (const subFolder of node.subFolders) {
          nodes.push(subFolder)
        }
      }
    }
    return folders
  }

  checkAllInFavorite(designs: IDesign[]): boolean {
    // const favoriteDesignIds = store.getters['design/getFavoriteDesigns'].map((pathedDesign: IPathedDesign) => pathedDesign.design.id)
    return !designs.some(design => !design.favorite)
  }

  checkRecoveredDirectory(folders: IFolder[], path: string[]): string {
    const targetFolder = this.search(folders, path)
    if (targetFolder) {
      return targetFolder.name === this.ROOT ? this.ROOT_DISPLAY : targetFolder.name
    } else {
      return this.ROOT_DISPLAY
    }
  }

  isParentOrEqual(a: IPathedFolder, b: IPathedFolder): boolean {
    const aFullPath = this.createPath(a).join('/')
    const bFullPath = this.createPath(b).join('/')
    return bFullPath.startsWith(aFullPath)
  }

  isFolderEqual(a: IPathedFolder, b: IPathedFolder): boolean {
    return generalUtils.arrayCompare<string>(a.parents, b.parents) && a.folder.id === b.folder.id
  }

  dispatchDesignMenuAction(icon: string, design: IDesign, eventEmitter: (extraEvent: { event: string, payload: any }) => void) {
    switch (icon) {
      case 'copy': {
        store.dispatch('design/copyDesign', design)
        break
      }
      case 'trash': {
        this.delete(design)
        eventEmitter({
          event: 'deleteItem',
          payload: {
            type: 'design',
            data: design
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
    }
  }

  dispatchFolderMenuAction(icon: string, parents: string[], folder: IFolder): { event: string, payload: any } | undefined {
    switch (icon) {
      case 'delete': {
        return {
          event: 'deleteFolderForever',
          payload: { parents, folder }
        }
      }
      case 'reduction': {
        this.recoverFolder({ parents, folder })
        return {
          event: 'recoverItem',
          payload: {
            type: 'folder',
            data: { parents, folder }
          }
        }
      }
    }
  }

  addNewFolder(path: string[]): string {
    const folder = this.newFolder('未命名資料夾', 'Daniel') // TODO: use usernames instead
    store.commit('design/UPDATE_addFolder', {
      parents: path,
      folder
    })
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

  moveFolder(folder: IFolder, source: string[], destination: string[]) {
    // if move to current folder, skip moving
    if (generalUtils.arrayCompare<string>(source, destination)) return
    console.log(folder, source, destination)
    store.commit('design/UPDATE_deleteFolder', {
      parents: source,
      folder
    })
    store.commit('design/UPDATE_addFolder', {
      parents: destination,
      folder
    })
  }

  delete(design: IDesign) {
    store.dispatch('design/deleteDesign', design)
  }

  deleteAll(designs: IDesign[]) {
    store.dispatch('design/deleteDesigns', designs)
  }

  deleteFolder(pathedFolder: IPathedFolder) {
    store.commit('design/UPDATE_addFolderToTrash', pathedFolder)
    store.commit('design/UPDATE_deleteFolder', pathedFolder)
  }

  deleteForever(design: IDesign) {
    store.dispatch('design/deleteDesignForever', design)
  }

  deleteAllForever(designs: IDesign[]) {
    store.dispatch('design/deleteDesignsForever', designs)
  }

  deleteFolderForever(pathedFolder: IPathedFolder) {
    store.commit('design/UPDATE_removeFolderFromTrash', pathedFolder)
  }

  deleteAllFolderForever(pathedFolders: IPathedFolder[]) {
    for (const pathedFolder of pathedFolders) {
      this.deleteFolderForever(pathedFolder)
    }
  }

  async recover(design: IDesign): Promise<string> {
    return await store.dispatch('design/recoverDesign', design)
  }

  async recoverAll(designs: IDesign[]): Promise<string> {
    return await store.dispatch('design/recoverDesigns', designs)
  }

  recoverFolder(pathedFolder: IPathedFolder) {
    const folders = store.getters['design/getFolders'] as IFolder[]
    const folder = this.search(folders, pathedFolder.parents)
    if (folder) {
      store.commit('design/UPDATE_addFolder', pathedFolder)
    } else {
      store.commit('design/UPDATE_addFolder', {
        parents: [this.ROOT],
        folder: pathedFolder.folder
      })
    }
    store.commit('design/UPDATE_removeFolderFromTrash', pathedFolder)
  }

  recoverAllFolder(pathedFolders: IPathedFolder[]) {
    for (const pathedFolder of pathedFolders) {
      this.recoverFolder(pathedFolder)
    }
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

  isMaxLevelReached(level: number) {
    return level >= 4
  }

  fetchDesigns(fetcher: () => Promise<void>) {
    store.commit('design/SET_allDesigns', [])
    store.commit('design/SET_isDesignsLoading', true)
    fetcher().then(() => {
      store.commit('design/SET_isDesignsLoading', false)
    })
  }

  getDesignPreview(assetId: string, scale = 2 as 1 | 2, ver?: number): string {
    const prevImageName = `0_prev${scale === 2 ? '_2x' : ''}`
    const verstring = ver?.toString() ?? generalUtils.generateRandomString(6)
    const previewUrl = `https://template.vivipic.com/${uploadUtils.loginOutput.upload_map.path}asset/design/${assetId}/${prevImageName}?ver=${verstring}`
    return previewUrl
  }

  // Below function is used to update the page
  newDesign(width?: number, height?: number) {
    pageUtils.setPages([pageUtils.newPage({
      width: width ?? 1080,
      height: height ?? 1080
    })])
    pageUtils.clearPagesInfo()
    if (this.isLogin) {
      uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_DB)
      /**
       * @Note using "router.replace" instead of "router.push" to prevent from adding a new history entry
       */
      router.replace({ query: Object.assign({}, router.currentRoute.query, { type: 'design', design_id: uploadUtils.assetId }) })
    }
  }

  setDesign(design: IUserDesignContentData) {
    // if(uploadUtils.assetId.length !== 0) {
    //   uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_DB)
    // }

    pageUtils.clearPagesInfo()
    if (this.isLogin) {
      store.commit('SET_assetId', design.id)
      if (router.currentRoute.query.design_id !== design.id) {
        router.replace({ query: Object.assign({}, router.currentRoute.query, { type: 'design', design_id: design.id }) })
      }
    }

    uploadUtils.getDesign('design', design.id ?? '')
  }
}

export default new DesignUtils()
