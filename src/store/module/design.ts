import { IDesign, IFolder, IPathedFolder } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import generalUtils from '@/utils/generalUtils'
import designApis from '@/apis/design'
import { GetterTree, MutationTree, ActionTree } from 'vuex'
import Vue from 'vue'
import { IUserDesignContentData, IUserFolderContentData } from '@/interfaces/api'

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
  isDesignsLoading: boolean,
  sortByField: string,
  sortByDescending: boolean,
  inDeletionView: boolean
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
  isDesignsLoading: false,
  sortByField: 'update',
  sortByDescending: true,
  inDeletionView: false
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
  },
  getSortByField(state: IDesignState): string {
    return state.sortByField
  },
  getSortByDescending(state: IDesignState): boolean {
    return state.sortByDescending
  },
  getInDeletionView(state: IDesignState): boolean {
    return state.inDeletionView
  }
}

const actions: ActionTree<IDesignState, unknown> = {
  async fetchDesigns({ commit, getters }, { path, sortByField, sortByDescending }) {
    try {
      sortByField = sortByField ?? getters.getSortByField
      sortByDescending = sortByDescending ?? getters.getSortByDescending
      const { data } = await designApis.getDesigns(designApis.getToken(), path, false, sortByField, sortByDescending)
      const designs = data.data.design.content.map((design: IUserDesignContentData) => {
        return designUtils.apiDesign2IDesign(design)
      })
      commit('SET_allDesigns', designs)
    } catch (error) {
      console.log(error)
    }
  },
  async fetchFolders({ commit }, { path, sortByField, sortByDescending }) {
    try {
      sortByField = sortByField ?? getters.getSortByField
      sortByDescending = sortByDescending ?? getters.getSortByDescending
      const { data } = await designApis.getDesigns(designApis.getToken(), path, true, sortByField, sortByDescending)
      const folders = data.data.design.folder.map((folder: IUserFolderContentData) => {
        return designUtils.apiFolder2IFolder(folder)
      })
      commit('UPDATE_folders', {
        path,
        folders
      })
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
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', design.asset_index.toString(), null, '1')
    commit('UPDATE_deleteDesign', design)
  },
  async copyDesign({ commit }, design: IDesign) {
    const newId = generalUtils.generateAssetId() + '_new'
    const newDesign = generalUtils.deepCopy(design)
    newDesign.id = newId
    newDesign.name = '...'
    newDesign.createdTime = new Date().toString()
    newDesign.lastUpdatedTime = newDesign.createdTime
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'copy', design.asset_index.toString(), null, '1')
      .then((response) => {
        commit('UPDATE_replaceDesign', {
          id: newId,
          design: designUtils.apiDesign2IDesign(response.data.data)
        })
      })
    commit('UPDATE_addDesign', newDesign)
  },
  async favorDesign({ commit }, design: IDesign) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'favor', design.asset_index.toString(), null, '1')
    design.favorite = true
  },
  async unfavorDesign({ commit }, design: IDesign) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'favor', design.asset_index.toString(), null, '0')
    design.favorite = false
  },
  async setDesignName({ commit }, { design, name }: { design: IDesign, name: string}) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'rename', design.asset_index.toString(), null, name)
    design.name = name
  },
  async recoverDesign({ commit, getters }, design: IDesign) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', design.asset_index.toString(), '', '0')
      .then((response) => {
        console.log(response)
      })
    if (getters.getCurrLocation === 't') {
      commit('UPDATE_deleteDesign', design)
    } else {
      if (!getters.getInDeletionView) return
      commit('UPDATE_addDesign', design)
    }
  },
  async deleteDesignForever({ commit }, design: IDesign) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', design.asset_index.toString(), '', '2')
      .then((response) => {
        console.log(response)
      })
    commit('UPDATE_deleteDesign', design)
  }
}

const mutations: MutationTree<IDesignState> = {
  SET_currLocation(state: IDesignState, currLocation: string) {
    if (state.currLocation === currLocation) return
    const folders = generalUtils.deepCopy(state.folders)
    designUtils.dislocateFrom(folders, state.currLocation)
    designUtils.locateTo(folders, currLocation)
    state.currLocation = currLocation
    state.folders = folders
    state.sortByField = 'update'
    state.sortByDescending = true
    state.inDeletionView = false
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
  SET_sortByField(state: IDesignState, sortByField: string) {
    state.sortByField = sortByField
  },
  SET_sortByDescending(state: IDesignState, sortByDescending: boolean) {
    state.sortByDescending = sortByDescending
  },
  UPDATE_folders(state: IDesignState, updateInfo: {path: string, folders: IFolder[]}) {
    let pathNodes
    if (updateInfo.path === 'root') {
      pathNodes = [designUtils.ROOT]
    } else {
      pathNodes = [designUtils.ROOT, ...updateInfo.path.split(',')]
    }
    const targetFolder = designUtils.search(state.folders, pathNodes)
    if (targetFolder) {
      targetFolder.subFolders = designUtils.updateFolders(targetFolder.subFolders, updateInfo.folders)
    }
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
  UPDATE_addDesign(state: IDesignState, design: IDesign) {
    const index = designUtils.getInsertIndex(state.allDesigns, state.sortByField, state.sortByDescending, design)
    state.allDesigns.splice(index, 0, design)
  },
  UPDATE_replaceDesign(state: IDesignState, updateInfo: {id: string, design: IDesign}) {
    const index = state.allDesigns.findIndex((design_) => design_.id === updateInfo.id)
    state.allDesigns.splice(index, 1, updateInfo.design)
  },
  UPDATE_deleteDesign(state: IDesignState, design: IDesign) {
    const index = state.allDesigns.findIndex((design_) => design_.id === design.id)
    if (index >= 0) {
      state.inDeletionView = true
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
