import { IDesign, IFolder, IPathedDesign, IPathedFolder } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import generalUtils from '@/utils/generalUtils'
import { GetterTree, MutationTree } from 'vuex'
import Vue from 'vue'

interface IDesignSidebarState {
  currLocation: string,
  folders: IFolder[],
  favoriteDesigns: IPathedDesign[],
  trashDesigns: IPathedDesign[],
  trashFolders: IPathedFolder[],
  draggingType: 'design' | 'folder' | '',
  draggingDesign: IPathedDesign | undefined,
  draggingFolder: IPathedFolder | undefined,
  selectedDesigns: {[key: string]: IPathedDesign}
  selectedFolders: {[key: string]: IPathedFolder}
}

const getDefaultState = (): IDesignSidebarState => ({
  currLocation: 'a',
  folders: [],
  favoriteDesigns: [],
  trashDesigns: [],
  trashFolders: [],
  draggingType: '',
  draggingFolder: undefined,
  draggingDesign: undefined,
  selectedDesigns: {},
  selectedFolders: {}
})

const state = getDefaultState()
const getters: GetterTree<IDesignSidebarState, unknown> = {
  getCurrLocation(state: IDesignSidebarState): string {
    return state.currLocation
  },
  getFolders(state: IDesignSidebarState): IFolder[] {
    return state.folders
  },
  getFavoriteDesigns(state: IDesignSidebarState): IPathedDesign[] {
    return state.favoriteDesigns
  },
  getTrashDesigns(state: IDesignSidebarState): IPathedDesign[] {
    return state.trashDesigns
  },
  getTrashFolders(state: IDesignSidebarState): IPathedFolder[] {
    return state.trashFolders
  },
  getDraggingType(state: IDesignSidebarState): string {
    return state.draggingType
  },
  getDraggingFolder(state: IDesignSidebarState): IPathedFolder | undefined {
    return state.draggingFolder
  },
  getDraggingDesign(state: IDesignSidebarState): IPathedDesign | undefined {
    return state.draggingDesign
  },
  getSelectedDesigns(state: IDesignSidebarState): {[key: string]: IPathedDesign} {
    return state.selectedDesigns
  },
  getSelectedFolders(state: IDesignSidebarState): {[key: string]: IPathedFolder} {
    return state.selectedFolders
  }
}

const mutations: MutationTree<IDesignSidebarState> = {
  SET_currLocation(state: IDesignSidebarState, currLocation: string) {
    const folders = generalUtils.deepCopy(state.folders)
    designUtils.dislocateFrom(folders, state.currLocation)
    designUtils.locateTo(folders, currLocation)
    state.currLocation = currLocation
    state.folders = folders
  },
  SET_expand(state: IDesignSidebarState, updateInfo: {path: string[], isExpanded: boolean}) {
    const targetFolder = designUtils.search(state.folders, updateInfo.path)
    if (targetFolder) {
      targetFolder.isExpanded = updateInfo.isExpanded
    }
  },
  SET_folders(state: IDesignSidebarState, folders: IFolder[]) {
    state.folders = folders
  },
  SET_draggingFolder(state: IDesignSidebarState, draggingFolder: IPathedFolder | undefined) {
    if (draggingFolder) {
      state.draggingType = 'folder'
    } else {
      state.draggingType = ''
    }
    state.draggingFolder = draggingFolder
  },
  SET_draggingDesign(state: IDesignSidebarState, draggingDesign: IPathedDesign | undefined) {
    if (draggingDesign) {
      state.draggingType = 'design'
    } else {
      state.draggingType = ''
    }
    state.draggingDesign = draggingDesign
  },
  UPDATE_addToFavorite(state: IDesignSidebarState, pathedDesign: IPathedDesign) {
    state.favoriteDesigns.push(pathedDesign)
  },
  UPDATE_addToTrash(state: IDesignSidebarState, pathedDesign: IPathedDesign) {
    state.trashDesigns.push(pathedDesign)
  },
  UPDATE_addFolderToTrash(state: IDesignSidebarState, pathedFolder: IPathedFolder) {
    pathedFolder.folder.isCurrLocation = false
    state.trashFolders.push(pathedFolder)
  },
  UPDATE_removeFromFavorite(state: IDesignSidebarState, pathedDesign: IPathedDesign) {
    const index = state.favoriteDesigns.findIndex(pathedDesign1 => pathedDesign1.design.id === pathedDesign.design.id)
    if (index >= 0) {
      state.favoriteDesigns.splice(index, 1)
    }
  },
  UPDATE_removeFromTrash(state: IDesignSidebarState, pathedDesign: IPathedDesign) {
    const index = state.trashDesigns.findIndex(pathedDesign1 => pathedDesign1.design.id === pathedDesign.design.id)
    if (index >= 0) {
      state.trashDesigns.splice(index, 1)
    }
  },
  UPDATE_removeFolderFromTrash(state: IDesignSidebarState, pathedFolder: IPathedFolder) {
    const index = state.trashFolders.findIndex(pathedFolder1 => {
      return designUtils.isFolderEqual(pathedFolder1, pathedFolder)
    })
    if (index >= 0) {
      state.trashFolders.splice(index, 1)
    }
  },
  UPDATE_path(state: IDesignSidebarState, updateInfo: {id: string, path: string[]}) {
    const index = state.favoriteDesigns.findIndex(pathedDesign => pathedDesign.design.id === updateInfo.id)
    if (index >= 0) {
      state.favoriteDesigns[index].path = updateInfo.path
    }
    const index2 = state.trashDesigns.findIndex(pathedDesign => pathedDesign.design.id === updateInfo.id)
    if (index2 >= 0) {
      state.trashDesigns[index].path = updateInfo.path
    }
  },
  UPDATE_folderName(state: IDesignSidebarState, updateInfo: {path: string[], newFolderName: string}) {
    const targetFolder = designUtils.search(state.folders, updateInfo.path)
    if (targetFolder) {
      targetFolder.name = updateInfo.newFolderName
    }
  },
  UPDATE_designName(state: IDesignSidebarState, updateInfo: {path: string[], id: string, newDesignName: string}) {
    const targetFolder = designUtils.search(state.folders, updateInfo.path)
    if (targetFolder) {
      const index = targetFolder.designs.findIndex(design => design.id === updateInfo.id)
      if (index >= 0) {
        targetFolder.designs[index].name = updateInfo.newDesignName
      }
    }
  },
  UPDATE_addDesign(state: IDesignSidebarState, updateInfo: {path: string[], design: IDesign}) {
    const targetFolder = designUtils.search(state.folders, updateInfo.path)
    if (targetFolder) {
      targetFolder.designs.push(updateInfo.design)
    }
  },
  UPDATE_deleteDesign(state: IDesignSidebarState, updateInfo: {path: string[], design: IDesign}) {
    const targetFolder = designUtils.search(state.folders, updateInfo.path)
    if (targetFolder) {
      const index = targetFolder.designs.findIndex(design => design.id === updateInfo.design.id)
      if (index >= 0) {
        targetFolder.designs.splice(index, 1)
      }
    }
  },
  UPDATE_addFolder(state: IDesignSidebarState, pathedFolder: IPathedFolder) {
    const targetParent = designUtils.search(state.folders, pathedFolder.parents)
    if (targetParent) {
      targetParent.subFolders.push(pathedFolder.folder)
    }
  },
  UPDATE_deleteFolder(state: IDesignSidebarState, updateInfo: {parents: string[], folder: IFolder}) {
    const targetParent = designUtils.search(state.folders, updateInfo.parents)
    if (targetParent) {
      const index = targetParent.subFolders.findIndex(folder => folder.id === updateInfo.folder.id)
      if (index >= 0) {
        targetParent.subFolders.splice(index, 1)
      }
    }
  },
  UPDATE_addToSelection(state: IDesignSidebarState, pathedDesign: IPathedDesign) {
    Vue.set(state.selectedDesigns, pathedDesign.design.id, pathedDesign)
  },
  UPDATE_removeFromSelection(state: IDesignSidebarState, pathedDesign: IPathedDesign) {
    Vue.delete(state.selectedDesigns, pathedDesign.design.id)
  },
  UPDATE_addFolderToSelection(state: IDesignSidebarState, pathedFolder: IPathedFolder) {
    Vue.set(state.selectedFolders, pathedFolder.folder.id, pathedFolder)
  },
  UPDATE_removeFolderFromSelection(state: IDesignSidebarState, pathedFolder: IPathedFolder) {
    Vue.delete(state.selectedFolders, pathedFolder.folder.id)
  },
  UPDATE_clearSelection(state: IDesignSidebarState) {
    state.selectedDesigns = {}
    state.selectedFolders = {}
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
