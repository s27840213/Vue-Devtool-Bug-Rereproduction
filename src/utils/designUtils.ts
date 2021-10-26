import { IDesign, IFolder, IPathedDesign, IPathedFolder } from '@/interfaces/design'
import store from '@/store'
import generalUtils from './generalUtils'

const FIELD_MAPPER: {[key: string]: (item: IDesign | IFolder) => any} = {
  name: (item: IDesign | IFolder): string => item.name,
  time: (item: IDesign | IFolder): number => item.lastUpdatedTime
}

const COMP_MAPPER: {[key: string]: (a: any, b: any, descending: boolean) => number} = {
  name: (a: string, b: string, descending: boolean): number => {
    const modifier = descending ? -1 : 1
    return a.localeCompare(b) * modifier
  },
  time: (a: number, b: number, descending: boolean): number => {
    const modifier = descending ? -1 : 1
    return (a - b) * modifier
  }
}

class DesignUtils {
  ROOT = '$ROOT$'
  ROOT_DISPLAY = '我所有的設計'

  newFolder(name: string, author: string, randomTime = false, isROOT = false): IFolder {
    const time = randomTime ? generalUtils.generateRandomTime(new Date(2021, 1, 1), new Date()) : Date.now()
    return {
      id: isROOT ? this.ROOT : generalUtils.generateAssetId(),
      name,
      author,
      createdTime: time,
      lastUpdatedTime: time,
      isExpanded: false,
      isSelected: false,
      designs: [],
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
    for (let i = 0; i < 15; i++) {
      const time = generalUtils.generateRandomTime(new Date(2021, 1, 1), new Date())
      template[0].subFolders[0].designs.push({
        name: `Name${i + 1}`,
        width: 1200,
        height: 1200,
        id: generalUtils.generateAssetId(),
        thumbnail: require(`@/assets/img/png/mydesign/sample${i + 1}.png`),
        createdTime: time,
        lastUpdatedTime: time
      })
    }
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

  makeNormalMenuItems(): {icon: string, text: string, extendable?: boolean}[] {
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

  makeFavoriteMenuItems(): {icon: string, text: string, extendable?: boolean}[] {
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

  makeTrashMenuItems(): {icon: string, text: string}[] {
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

  deselect(folders: IFolder[], selectInfo: string) {
    if (selectInfo.startsWith('f')) { // f:Toby/素材/材質
      const targetFolder = this.search(folders, this.makePath(selectInfo))
      if (targetFolder) {
        targetFolder.isSelected = false
      }
    }
  }

  select(folders: IFolder[], selectInfo: string) {
    if (selectInfo.startsWith('f')) { // f:Toby/素材/材質
      const targetFolder = this.search(folders, this.makePath(selectInfo))
      if (targetFolder) {
        targetFolder.isSelected = true
      }
    }
  }

  move(design: IDesign, source: string[], destination: string[]) {
    // if move to current folder, skip moving
    if (generalUtils.arrayCompare<string>(source, destination)) return
    store.commit('design/UPDATE_deleteDesign', {
      path: source,
      design
    })
    store.commit('design/UPDATE_addDesign', {
      path: destination,
      design
    })
    store.commit('design/UPDATE_path', {
      id: design.id,
      path: destination
    })
  }

  moveFolder(folder: IFolder, source: string[], destination: string[]) {
    // if move to current folder, skip moving
    if (generalUtils.arrayCompare<string>(source, destination)) return
    store.commit('design/UPDATE_deleteFolder', {
      parents: source,
      folder
    })
    store.commit('design/UPDATE_addFolder', {
      parents: destination,
      folder
    })
    for (const design of folder.designs) {
      store.commit('design/UPDATE_path', {
        id: design.id,
        path: [...destination, folder.name]
      })
    }
  }

  getAllDesigns(folders: IFolder[]): IPathedDesign[] {
    const nodes: IPathedFolder[] = []
    for (const folder of folders) {
      nodes.push({
        parents: [],
        folder
      })
    }
    const res = []
    while (nodes.length > 0) {
      const node = nodes.shift()
      if (node) {
        const { parents, folder } = node
        for (const design of folder.designs) {
          res.push({
            path: this.createPath(node),
            design
          })
        }
        for (const subFolder of folder.subFolders) {
          nodes.push({
            parents: this.createPath(node),
            folder: subFolder
          })
        }
      }
    }
    return res
  }

  sortDesignsBy(designs: IDesign[] | IPathedDesign[], field: string, descending: boolean) {
    if (this.checkIfPathed(designs)) {
      const target = designs as IPathedDesign[]
      target.sort((a, b) => {
        return COMP_MAPPER[field](FIELD_MAPPER[field](a.design), FIELD_MAPPER[field](b.design), descending)
      })
    } else {
      const target = designs as IDesign[]
      target.sort((a, b) => {
        return COMP_MAPPER[field](FIELD_MAPPER[field](a), FIELD_MAPPER[field](b), descending)
      })
    }
  }

  sortFoldersBy(folders: IFolder[] | IPathedFolder[], field: string, descending: boolean) {
    if (this.checkIfPathed(folders)) {
      const target = folders as IPathedFolder[]
      target.sort((a, b) => {
        return COMP_MAPPER[field](FIELD_MAPPER[field](a.folder), FIELD_MAPPER[field](b.folder), descending)
      })
    } else {
      const target = folders as IFolder[]
      target.sort((a, b) => {
        return COMP_MAPPER[field](FIELD_MAPPER[field](a), FIELD_MAPPER[field](b), descending)
      })
    }
  }

  removeDeleted(designs: IPathedDesign[]): IPathedDesign[] {
    const deletedDesignIds = store.getters['design/getTrashDesigns'].map((pathedDesign: IPathedDesign) => pathedDesign.design.id)
    return designs.filter(design => !(deletedDesignIds.includes(design.design.id)))
  }

  checkIfPathed(designs: IDesign[] | IPathedDesign[] | IFolder[] | IPathedFolder[]): boolean { // if empty, return true
    return (designs.length === 0) || ('path' in designs[0])
  }

  checkAllInFavorite(pathedDesigns: IPathedDesign[]): boolean {
    const favoriteDesignIds = store.getters['design/getFavoriteDesigns'].map((pathedDesign: IPathedDesign) => pathedDesign.design.id)
    return !pathedDesigns.some(pathedDesign => !favoriteDesignIds.includes(pathedDesign.design.id))
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

  dispatchDesignMenuAction(icon: string, path: string[], design: IDesign) {
    switch (icon) {
      case 'copy': {
        const newId = generalUtils.generateAssetId()
        const newDesign = generalUtils.deepCopy(design)
        newDesign.id = newId
        newDesign.name += ' 的副本'
        store.commit('design/UPDATE_addDesign', {
          path,
          design: newDesign
        })
        break
      }
      case 'trash': {
        this.delete({ path, design })
        break
      }
      case 'reduction': {
        this.recover({ path, design })
        break
      }
    }
  }

  addNewFolder(path: string[]) {
    store.commit('design/UPDATE_addFolder', {
      parents: path,
      folder: this.newFolder('新增資料夾', 'Daniel') // TODO: use usernames instead
    })
  }

  deleteFolder(pathedFolder: IPathedFolder) {
    store.commit('design/UPDATE_addFolderToTrash', pathedFolder)
    store.commit('design/UPDATE_deleteFolder', pathedFolder)
  }

  deleteForever(pathedDesign: IPathedDesign) {
    store.commit('design/UPDATE_removeFromFavorite', pathedDesign)
    store.commit('design/UPDATE_removeFromTrash', pathedDesign)
  }

  delete(pathedDesign: IPathedDesign) {
    store.commit('design/UPDATE_addToTrash', pathedDesign)
    store.commit('design/UPDATE_deleteDesign', pathedDesign)
  }

  recover(pathedDesign: IPathedDesign) {
    const folders = store.getters['design/getFolders'] as IFolder[]
    const folder = this.search(folders, pathedDesign.path)
    if (folder) {
      store.commit('design/UPDATE_addDesign', pathedDesign)
    } else {
      store.commit('design/UPDATE_addDesign', {
        path: [this.ROOT],
        design: pathedDesign.design
      })
    }
    store.commit('design/UPDATE_removeFromTrash', pathedDesign)
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

  removeAllFromFavorite(pathedDesigns: IPathedDesign[]) {
    for (const pathedDesign of pathedDesigns) {
      store.commit('design/UPDATE_removeFromFavorite', pathedDesign)
    }
  }

  addAllToFavorite(pathedDesigns: IPathedDesign[]) {
    const favoriteDesignIds = store.getters['design/getFavoriteDesigns'].map((pathedDesign: IPathedDesign) => pathedDesign.design.id)
    for (const pathedDesign of pathedDesigns) {
      if (favoriteDesignIds.includes(pathedDesign.design.id)) continue
      store.commit('design/UPDATE_addToFavorite', pathedDesign)
    }
  }

  deleteAll(pathedDesigns: IPathedDesign[]) {
    for (const pathedDesign of pathedDesigns) {
      store.commit('design/UPDATE_addToTrash', pathedDesign)
      store.commit('design/UPDATE_deleteDesign', pathedDesign)
    }
  }

  moveAll(pathedDesigns: IPathedDesign[], destination: string[]) {
    for (const pathedDesign of pathedDesigns) {
      this.move(pathedDesign.design, pathedDesign.path, destination)
    }
  }
}

export default new DesignUtils()
