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
  newFolder(name: string, author: string): IFolder {
    const time = generalUtils.generateRandomTime(new Date(2021, 1, 1), new Date())
    return {
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
      currentFolder.subFolders.push(this.newFolder(path[i], author))
      currentFolder = currentFolder.subFolders[0]
    }
    return res
  }

  makeDesignsForTesting(): IFolder[] {
    const template: IFolder[] = []
    template[0] = this.newFolder('$ROOT$', 'SYSTEM')
    template[0].subFolders = [
      this.newFolders('Toby/素材2/材質3/材質4/材質5', 'Daniel'),
      this.newFolder('日本行銷', 'Daniel')
    ]
    for (let i = 0; i < 15; i++) {
      const time = generalUtils.generateRandomTime(new Date(2021, 1, 1), new Date())
      template[0].subFolders[0].designs.push({
        name: `Name${i + 1}`,
        width: 1200,
        height: 1200,
        id: `${generalUtils.generateAssetId()}`,
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

  findFolder(folders: IFolder[], name: string): IFolder | undefined {
    for (const folder of folders) {
      if (folder.name === name) {
        return folder
      }
    }
  }

  findFolders(folders: IFolder[], name: string): IFolder[] {
    for (const folder of folders) {
      if (folder.name === name) {
        return folder.subFolders
      }
    }
    return []
  }

  search(folders: IFolder[], path: string[]): IFolder | undefined {
    const parents = path.slice(0, path.length - 1)
    const name = path[path.length - 1]

    let currentFolders = folders
    for (const parent of parents) {
      currentFolders = this.findFolders(currentFolders, parent)
    }
    return this.findFolder(currentFolders, name)
  }

  goTo(folders: IFolder[], path: string[]): IFolder[] {
    let currentFolders = folders
    for (const node of path) {
      currentFolders = this.findFolders(currentFolders, node)
    }
    return currentFolders
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

  move(id: string, source: string[], destination: string[]) {
    // if move to current folder, skip moving
    if (generalUtils.arrayCompare<string>(source, destination)) return
    const folders = store.getters['design/getFolders']
    const sourceFolder = this.search(folders, source)
    if (!sourceFolder) {
      console.log('source path doesn\'t exist')
      return
    }
    const designIndex = sourceFolder.designs.findIndex(design => design.id === id)
    if (designIndex === -1) {
      console.log('source design doesn\'t exist')
      return
    }
    const design = sourceFolder.designs[designIndex]
    sourceFolder.designs.splice(designIndex, 1)

    const destFolder = this.search(folders, destination)
    if (!destFolder) {
      console.log('destination path doesn\'t exist')
      return
    }
    destFolder.designs.push(design)
    store.commit('design/SET_folders', folders)
    store.commit('design/UPDATE_path', {
      id,
      path: destination
    })
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
            path: [...parents, folder.name],
            design
          })
        }
        for (const subFolder of folder.subFolders) {
          nodes.push({
            parents: [...parents, folder.name],
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

  checkExistingFolderName(folders: IFolder[], parents: string[], name: string) {
    const subFolders = this.goTo(folders, parents)
    return subFolders.some(folder => folder.name === name)
  }

  checkExistingDesignName(folder: IFolder[], path: string[], name: string) {
    const targetFolder = this.search(folder, path)
    if (targetFolder) {
      return targetFolder.designs.some(design => design.name === name)
    }
    return false
  }

  checkAllInFavorite(pathedDesigns: IPathedDesign[]): boolean {
    const favoriteDesignIds = store.getters['design/getFavoriteDesigns'].map((pathedDesign: IPathedDesign) => pathedDesign.design.id)
    return !pathedDesigns.some(pathedDesign => !favoriteDesignIds.includes(pathedDesign.design.id))
  }

  checkRecoveredDirectory(folders: IFolder[], path: string[]): string {
    const targetFolder = this.search(folders, path)
    if (targetFolder) {
      return targetFolder.name === '$ROOT$' ? '我所有的設計' : targetFolder.name
    } else {
      return '我所有的設計'
    }
  }

  dispatchDesignMenuAction(icon: string, path: string[], design: IDesign, isInFavorites: boolean) {
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
        if (isInFavorites) {
          store.commit('design/UPDATE_addToFavorite', {
            path,
            design: newDesign
          })
        }
        break
      }
      case 'trash': {
        store.commit('design/UPDATE_addToTrash', {
          path,
          design
        })
        store.commit('design/UPDATE_deleteDesign', {
          path,
          design
        })
        break
      }
      case 'reduction': {
        this.recover(design.id)
        break
      }
    }
  }

  addNewFolder(folders: IFolder[], path: string[]) {
    const newFolderNamePrefix = '新增資料夾'
    let newFolderName = newFolderNamePrefix
    let postfixCounter = 1
    const targetFolder = this.search(folders, path)
    if (!targetFolder) return
    while (targetFolder.subFolders.some(folder => folder.name === newFolderName)) {
      postfixCounter++
      newFolderName = `${newFolderNamePrefix}${postfixCounter}`
    }
    store.commit('design/UPDATE_addFolder', {
      parents: path,
      folder: {
        name: newFolderName,
        isExpanded: false,
        isSelected: false,
        designs: [],
        subFolders: []
      }
    })
  }

  deleteFolder(parents: string[], folder: IFolder) {
    store.commit('design/UPDATE_addFolderToTrash', {
      parents,
      folder
    })
    store.commit('design/UPDATE_deleteFolder', {
      parents,
      folder
    })
  }

  recover(id: string) {
    const folders = store.getters['design/getFolders'] as IFolder[]
    const trashDesigns = store.getters['design/getTrashDesigns'] as IPathedDesign[]
    const index = trashDesigns.findIndex(pathedDesign => pathedDesign.design.id === id)
    const pathedDesign = trashDesigns[index]
    const folder = this.search(folders, pathedDesign.path)
    if (folder) {
      store.commit('design/UPDATE_addDesign', {
        path: pathedDesign.path,
        design: pathedDesign.design
      })
    } else {
      store.commit('design/UPDATE_addDesign', {
        path: ['$ROOT$'],
        design: pathedDesign.design
      })
    }
    store.commit('design/UPDATE_removeFromTrash', {
      path: pathedDesign.path,
      design: pathedDesign.design
    })
  }

  removeAllFromFavorite(pathedDesigns: IPathedDesign[]) {
    for (const pathedDesign of pathedDesigns) {
      store.commit('design/UPDATE_removeFromFavorite', {
        path: pathedDesign.path,
        design: pathedDesign.design
      })
    }
  }

  addAllToFavorite(pathedDesigns: IPathedDesign[]) {
    const favoriteDesignIds = store.getters['design/getFavoriteDesigns'].map((pathedDesign: IPathedDesign) => pathedDesign.design.id)
    for (const pathedDesign of pathedDesigns) {
      if (favoriteDesignIds.includes(pathedDesign.design.id)) continue
      store.commit('design/UPDATE_addToFavorite', {
        path: pathedDesign.path,
        design: pathedDesign.design
      })
    }
  }

  deleteAll(pathedDesigns: IPathedDesign[]) {
    for (const pathedDesign of pathedDesigns) {
      store.commit('design/UPDATE_addToTrash', {
        path: pathedDesign.path,
        design: pathedDesign.design
      })
      store.commit('design/UPDATE_deleteDesign', {
        path: pathedDesign.path,
        design: pathedDesign.design
      })
    }
  }

  moveAll(pathedDesigns: IPathedDesign[], destination: string[]) {
    for (const pathedDesign of pathedDesigns) {
      this.move(pathedDesign.design.id, pathedDesign.path, destination)
    }
  }
}

export default new DesignUtils()
