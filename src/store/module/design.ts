import { IDesign, IFolder, IPathedFolder } from '@/interfaces/design'
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
  allDesigns: IDesign[],
  trashFolders: IPathedFolder[],
  draggingType: 'design' | 'folder' | '',
  draggingDesign: IDesign | undefined,
  draggingFolder: IPathedFolder | undefined,
  selectedDesigns: {[key: string]: IDesign}
  selectedFolders: {[key: string]: IPathedFolder},
  destinationFolder: string,
  isDesignsLoading: boolean
}

const getDefaultState = (): IDesignState => ({
  currLocation: 'a',
  folders: [],
  allDesigns: [],
  trashFolders: [],
  draggingType: '',
  draggingFolder: undefined,
  draggingDesign: undefined,
  selectedDesigns: {},
  selectedFolders: {},
  destinationFolder: '',
  isDesignsLoading: false
})

const state = getDefaultState()
const getters: GetterTree<IDesignState, unknown> = {
  getCurrLocation(state: IDesignState): string {
    return state.currLocation
  },
  getFolders(state: IDesignState): IFolder[] {
    return state.folders
  },
  getAllDesigns(state: IDesignState): IDesign[] {
    return state.allDesigns
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
  getDraggingDesign(state: IDesignState): IDesign | undefined {
    return state.draggingDesign
  },
  getSelectedDesigns(state: IDesignState): {[key: string]: IDesign} {
    return state.selectedDesigns
  },
  getSelectedFolders(state: IDesignState): {[key: string]: IPathedFolder} {
    return state.selectedFolders
  },
  getDestinationFolder(state: IDesignState): string {
    return state.destinationFolder
  },
  getIsDesignsLoading(state: IDesignState): boolean {
    return state.isDesignsLoading
  }
}

const actions: ActionTree<IDesignState, unknown> = {
  async fetchDesigns({ commit }, { path, sortByField = 'upate', sortByDescending = true }) {
    try {
      const { data } = await designApis.getDesigns(store.getters['user/getToken'], path, false, sortByField, sortByDescending)
      const designs = data.data.design.content.map((design: IUserDesignContentData) => {
        return designUtils.apiDesign2IDesign(design)
      })
      commit('SET_allDesigns', designs)
    } catch (error) {
      console.log(error)
    }
  },
  async fetchAllDesigns({ dispatch }) {
    await dispatch('fetchDesigns', { path: '' })
  },
  async fetchFavoriteDesigns({ dispatch }) {
    await dispatch('fetchDesigns', { path: 'favor' })
  },
  async fetchTrashDesigns({ dispatch }) {
    await dispatch('fetchDesigns', { path: 'trash' })
  },
  async fetchFolderDesigns({ dispatch }, { path, sortByField, sortByDescending }) {
    await dispatch('fetchDesigns', { path, sortByField, sortByDescending })
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
    commit('UPDATE_addDesign', newDesign)
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
  SET_allDesigns(state: IDesignState, designs: IDesign[]) {
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
  SET_draggingDesign(state: IDesignState, draggingDesign: IDesign | undefined) {
    if (draggingDesign) {
      state.draggingType = 'design'
    } else {
      state.draggingType = ''
    }
    state.draggingDesign = draggingDesign
  },
  SET_destinationFolder(state: IDesignState, destinationFolder: string) {
    state.destinationFolder = destinationFolder
  },
  SET_isDesignsLoading(state: IDesignState, isDesignsLoading: boolean) {
    state.isDesignsLoading = isDesignsLoading
  },
  UPDATE_addFolderToTrash(state: IDesignState, pathedFolder: IPathedFolder) {
    pathedFolder.folder.isCurrLocation = false
    state.trashFolders.push(pathedFolder)
  },
  UPDATE_removeFolderFromTrash(state: IDesignState, pathedFolder: IPathedFolder) {
    const index = state.trashFolders.findIndex(pathedFolder1 => {
      return designUtils.isFolderEqual(pathedFolder1, pathedFolder)
    })
    if (index >= 0) {
      state.trashFolders.splice(index, 1)
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
  UPDATE_addDesign(state: IDesignState, design: IDesign) {
    state.allDesigns.splice(0, 0, design)
  },
  UPDATE_deleteDesign(state: IDesignState, design: IDesign) {
    const index = state.allDesigns.findIndex((design_) => design_.id === design.id)
    if (index >= 0) {
      state.allDesigns.splice(index, 1)
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
  UPDATE_addToSelection(state: IDesignState, design: IDesign) {
    Vue.set(state.selectedDesigns, design.id, design)
  },
  UPDATE_removeFromSelection(state: IDesignState, design: IDesign) {
    Vue.delete(state.selectedDesigns, design.id)
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
