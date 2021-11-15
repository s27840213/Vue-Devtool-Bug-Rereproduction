import { IDesign, IFolder, IPathedDesign, IPathedFolder } from '@/interfaces/design'
import store from '@/store'
import designUtils from '@/utils/designUtils'
import generalUtils from '@/utils/generalUtils'
import designApis from '@/apis/design'
import { GetterTree, MutationTree, ActionTree } from 'vuex'
import Vue from 'vue'
import { IUserDesignContentData } from '@/interfaces/api'

interface IDesignState {
  currLocation: string,
  folders: IFolder[],
  allDesigns: IPathedDesign[],
  folderDesigns: IPathedDesign[],
  favoriteDesigns: IPathedDesign[],
  trashDesigns: IPathedDesign[],
  trashFolders: IPathedFolder[],
  draggingType: 'design' | 'folder' | '',
  draggingDesign: IPathedDesign | undefined,
  draggingFolder: IPathedFolder | undefined,
  selectedDesigns: {[key: string]: IPathedDesign}
  selectedFolders: {[key: string]: IPathedFolder}
}

const getDefaultState = (): IDesignState => ({
  currLocation: 'a',
  folders: [],
  allDesigns: [],
  folderDesigns: [],
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
const getters: GetterTree<IDesignState, unknown> = {
  getCurrLocation(state: IDesignState): string {
    return state.currLocation
  },
  getFolders(state: IDesignState): IFolder[] {
    return state.folders
  },
  getAllDesigns(state: IDesignState): IPathedDesign[] {
    return state.allDesigns
  },
  getFavoriteDesigns(state: IDesignState): IPathedDesign[] {
    return state.favoriteDesigns
  },
  getTrashDesigns(state: IDesignState): IPathedDesign[] {
    return state.trashDesigns
  },
  getTrashFolders(state: IDesignState): IPathedFolder[] {
    return state.trashFolders
  },
  getDraggingType(state: IDesignState): string {
    return state.draggingType
  },
  getDraggingFolder(state: IDesignState): IPathedFolder | undefined {
    return state.draggingFolder
  },
  getDraggingDesign(state: IDesignState): IPathedDesign | undefined {
    return state.draggingDesign
  },
  getSelectedDesigns(state: IDesignState): {[key: string]: IPathedDesign} {
    return state.selectedDesigns
  },
  getSelectedFolders(state: IDesignState): {[key: string]: IPathedFolder} {
    return state.selectedFolders
  }
}

const actions: ActionTree<IDesignState, unknown> = {
  async fetchAllDesigns({ commit }) {
    try {
      const { data } = await designApis.getDesigns(store.getters['user/getToken'], '', false, 'update', true)
      const pathedDesigns = data.data.design.content.map((design: IUserDesignContentData) => {
        return {
          path: [],
          design: designUtils.apiDesign2IDesign(design)
        }
      })
      commit('SET_allDesigns', pathedDesigns)
    } catch (error) {
      console.log(error)
    }
  },
  async deleteDesign({ commit }, design: IDesign) {
    // TODO: send API to delete
    commit('UPDATE_deleteDesign', design)
  },
  async copyDesign({ commit }, design: IDesign) {
    // TODO: send API to copy
    const newId = generalUtils.generateAssetId()
    const newDesign = generalUtils.deepCopy(design)
    newDesign.id = newId
    newDesign.name += ' 的副本'
    newDesign.createdTime = Date.now()
    newDesign.lastUpdatedTime = newDesign.createdTime
    commit('UPDATE_addDesign', {
      path: [],
      design: newDesign
    })
  }
}

const mutations: MutationTree<IDesignState> = {
  SET_currLocation(state: IDesignState, currLocation: string) {
    const folders = generalUtils.deepCopy(state.folders)
    designUtils.dislocateFrom(folders, state.currLocation)
    designUtils.locateTo(folders, currLocation)
    state.currLocation = currLocation
    state.folders = folders
  },
  SET_expand(state: IDesignState, updateInfo: {path: string[], isExpanded: boolean}) {
    const targetFolder = designUtils.search(state.folders, updateInfo.path)
    if (targetFolder) {
      targetFolder.isExpanded = updateInfo.isExpanded
    }
  },
  SET_folders(state: IDesignState, folders: IFolder[]) {
    state.folders = folders
  },
  SET_allDesigns(state: IDesignState, designs: IPathedDesign[]) {
    state.allDesigns = designs
  },
  SET_draggingFolder(state: IDesignState, draggingFolder: IPathedFolder | undefined) {
    if (draggingFolder) {
      state.draggingType = 'folder'
    } else {
      state.draggingType = ''
    }
    state.draggingFolder = draggingFolder
  },
  SET_draggingDesign(state: IDesignState, draggingDesign: IPathedDesign | undefined) {
    if (draggingDesign) {
      state.draggingType = 'design'
    } else {
      state.draggingType = ''
    }
    state.draggingDesign = draggingDesign
  },
  UPDATE_addToFavorite(state: IDesignState, pathedDesign: IPathedDesign) {
    state.favoriteDesigns.push(pathedDesign)
  },
  UPDATE_addToTrash(state: IDesignState, pathedDesign: IPathedDesign) {
    state.trashDesigns.push(pathedDesign)
  },
  UPDATE_addFolderToTrash(state: IDesignState, pathedFolder: IPathedFolder) {
    pathedFolder.folder.isCurrLocation = false
    state.trashFolders.push(pathedFolder)
  },
  UPDATE_removeFromFavorite(state: IDesignState, pathedDesign: IPathedDesign) {
    const index = state.favoriteDesigns.findIndex(pathedDesign1 => pathedDesign1.design.id === pathedDesign.design.id)
    if (index >= 0) {
      state.favoriteDesigns.splice(index, 1)
    }
  },
  UPDATE_removeFromTrash(state: IDesignState, pathedDesign: IPathedDesign) {
    const index = state.trashDesigns.findIndex(pathedDesign1 => pathedDesign1.design.id === pathedDesign.design.id)
    if (index >= 0) {
      state.trashDesigns.splice(index, 1)
    }
  },
  UPDATE_removeFolderFromTrash(state: IDesignState, pathedFolder: IPathedFolder) {
    const index = state.trashFolders.findIndex(pathedFolder1 => {
      return designUtils.isFolderEqual(pathedFolder1, pathedFolder)
    })
    if (index >= 0) {
      state.trashFolders.splice(index, 1)
    }
  },
  UPDATE_path(state: IDesignState, updateInfo: {id: string, path: string[]}) {
    const index = state.favoriteDesigns.findIndex(pathedDesign => pathedDesign.design.id === updateInfo.id)
    if (index >= 0) {
      state.favoriteDesigns[index].path = updateInfo.path
    }
    const index2 = state.trashDesigns.findIndex(pathedDesign => pathedDesign.design.id === updateInfo.id)
    if (index2 >= 0) {
      state.trashDesigns[index].path = updateInfo.path
    }
  },
  UPDATE_folderName(state: IDesignState, updateInfo: {path: string[], newFolderName: string}) {
    const targetFolder = designUtils.search(state.folders, updateInfo.path)
    if (targetFolder) {
      targetFolder.name = updateInfo.newFolderName
    }
  },
  UPDATE_designName(state: IDesignState, updateInfo: {path: string[], id: string, newDesignName: string}) {
    const targetFolder = designUtils.search(state.folders, updateInfo.path)
    if (targetFolder) {
      const index = targetFolder.designs.findIndex(design => design.id === updateInfo.id)
      if (index >= 0) {
        targetFolder.designs[index].name = updateInfo.newDesignName
      }
    }
  },
  UPDATE_addDesign(state: IDesignState, updateInfo: {path: string[], design: IDesign}) {
    const list = designUtils.getCurrList(state)
    list.splice(0, 0, updateInfo)
  },
  UPDATE_deleteDesign(state: IDesignState, design: IDesign) {
    const list = designUtils.getCurrList(state)
    const index = list.findIndex(pathedDesign => pathedDesign.design.id === design.id)
    if (index >= 0) {
      list.splice(index, 1)
    }
  },
  UPDATE_addFolder(state: IDesignState, pathedFolder: IPathedFolder) {
    const targetParent = designUtils.search(state.folders, pathedFolder.parents)
    if (targetParent) {
      targetParent.subFolders.push(pathedFolder.folder)
    }
  },
  UPDATE_deleteFolder(state: IDesignState, updateInfo: {parents: string[], folder: IFolder}) {
    const targetParent = designUtils.search(state.folders, updateInfo.parents)
    if (targetParent) {
      const index = targetParent.subFolders.findIndex(folder => folder.id === updateInfo.folder.id)
      if (index >= 0) {
        targetParent.subFolders.splice(index, 1)
      }
    }
  },
  UPDATE_addToSelection(state: IDesignState, pathedDesign: IPathedDesign) {
    Vue.set(state.selectedDesigns, pathedDesign.design.id, pathedDesign)
  },
  UPDATE_removeFromSelection(state: IDesignState, pathedDesign: IPathedDesign) {
    Vue.delete(state.selectedDesigns, pathedDesign.design.id)
  },
  UPDATE_addFolderToSelection(state: IDesignState, pathedFolder: IPathedFolder) {
    Vue.set(state.selectedFolders, pathedFolder.folder.id, pathedFolder)
  },
  UPDATE_removeFolderFromSelection(state: IDesignState, pathedFolder: IPathedFolder) {
    Vue.delete(state.selectedFolders, pathedFolder.folder.id)
  },
  UPDATE_clearSelection(state: IDesignState) {
    state.selectedDesigns = {}
    state.selectedFolders = {}
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
