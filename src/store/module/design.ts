import { IDesign, IFolder, IPathedFolder } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import generalUtils from '@/utils/generalUtils'
import designApis from '@/apis/design'
import { GetterTree, MutationTree, ActionTree } from 'vuex'
import Vue from 'vue'
import router from '@/router'
import { IUserDesignContentData, IUserFolderContentData } from '@/interfaces/api'

interface IDesignState {
  currLocation: string,
  folders: IFolder[],
  allDesigns: IDesign[],
  allFolders: IFolder[],
  draggingType: 'design' | 'folder' | '',
  draggingDesign: IDesign | undefined,
  draggingFolder: IPathedFolder | undefined,
  selectedDesigns: {[key: string]: IDesign}
  selectedFolders: {[key: string]: IFolder},
  isDesignsLoading: boolean,
  isFoldersLoading: boolean,
  sortByField: string,
  sortByDescending: boolean,
  inDeletionView: boolean
}

const getDefaultState = (): IDesignState => ({
  currLocation: 'a',
  folders: [],
  allDesigns: [],
  allFolders: [],
  draggingType: '',
  draggingFolder: undefined,
  draggingDesign: undefined,
  selectedDesigns: {},
  selectedFolders: {},
  isDesignsLoading: false,
  isFoldersLoading: false,
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
  getAllFolders(state: IDesignState): IFolder[] {
    return state.allFolders
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
  getSelectedFolders(state: IDesignState): {[key: string]: IFolder} {
    return state.selectedFolders
  },
  getIsDesignsLoading(state: IDesignState): boolean {
    return state.isDesignsLoading
  },
  getIsFoldersLoading(state: IDesignState): boolean {
    return state.isFoldersLoading
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
  async fetchFolders({ commit, getters }, { path, sortByField, sortByDescending }) {
    try {
      sortByField = sortByField ?? getters.getSortByField
      sortByDescending = sortByDescending ?? getters.getSortByDescending
      const { data } = await designApis.getDesigns(designApis.getToken(), path, true, sortByField, sortByDescending)
      return data.data.design.folder.map((folder: IUserFolderContentData) => {
        return designUtils.apiFolder2IFolder(folder)
      })
    } catch (error) {
      console.log(error)
    }
  },
  async fetchStructuralFolders({ commit, dispatch }, { path }) {
    const folders = await dispatch('fetchFolders', { path })
    commit('UPDATE_folders', {
      path,
      folders: folders ?? []
    })
    return folders === undefined
  },
  async fetchFoldersAlong({ commit, dispatch, getters }, { pathNodes }) {
    const path = []
    let currentFolder = getters.getFolders[0] as IFolder
    for (const node of pathNodes) {
      const index = currentFolder.subFolders.findIndex(folder => folder.id === node)
      if (index < 0) {
        commit('SET_currLocation', 'a')
        return
      }
      path.push(node)
      await dispatch('fetchStructuralFolders', { path: path.join(',') })
      currentFolder = currentFolder.subFolders[index]
      commit('SET_expand', {
        path: [designUtils.ROOT, ...path],
        isExpanded: true
      })
    }
    commit('UPDATE_currLocation')
  },
  async fetchTrashFolders({ commit, dispatch }) {
    const folders = (await dispatch('fetchFolders', { path: 'trash' })) ?? []
    commit('SET_allFolders', folders)
  },
  async fetchFolderFolders({ commit, dispatch }, { path, sortByField, sortByDescending }) {
    const folders = (await dispatch('fetchFolders', { path, sortByField, sortByDescending })) ?? []
    commit('SET_allFolders', folders)
    commit('UPDATE_folders', {
      path,
      folders
    })
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
  async copyDesign({ commit }, design: IDesign) {
    const newId = generalUtils.generateAssetId() + '_new'
    const newDesign = generalUtils.deepCopy(design)
    newDesign.id = newId
    newDesign.name = '...'
    newDesign.createdTime = new Date().toString()
    newDesign.lastUpdatedTime = newDesign.createdTime
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'copy', designApis.getAssetIndex(design), null, '1')
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
      'favor', designApis.getAssetIndex(design), null, '1')
    design.favorite = true
  },
  async favorDesigns({ commit }, designs: IDesign[]) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'favor', designApis.getAssetIndices(designs), null, '1')
    for (const design of designs) {
      design.favorite = true
    }
  },
  async unfavorDesign({ commit, getters }, design: IDesign) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'favor', designApis.getAssetIndex(design), null, '0')
    design.favorite = false
    if (getters.getCurrLocation === 'h') {
      commit('UPDATE_deleteDesign', design)
    }
  },
  async unfavorDesigns({ commit, getters }, designs: IDesign[]) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'favor', designApis.getAssetIndices(designs), null, '0')
    const inFavoriteView = getters.getCurrLocation === 'h'
    for (const design of designs) {
      design.favorite = false
      if (inFavoriteView) {
        commit('UPDATE_deleteDesign', design)
      }
    }
  },
  async setDesignName({ commit }, { design, name }: { design: IDesign, name: string}) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'rename', designApis.getAssetIndex(design), null, name)
    design.name = name
    commit('UPDATE_deleteDesign', design)
    commit('UPDATE_addDesign', design)
  },
  async deleteDesign({ commit }, design: IDesign) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', designApis.getAssetIndex(design), null, '1')
    commit('UPDATE_deleteDesign', design)
  },
  async deleteDesigns({ commit }, designs: IDesign[]) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', designApis.getAssetIndices(designs), null, '1')
    for (const design of designs) {
      commit('UPDATE_deleteDesign', design)
    }
  },
  async recoverDesign({ commit, getters }, design: IDesign) {
    if (getters.getCurrLocation === 't') {
      commit('UPDATE_deleteDesign', design)
    } else if (getters.getInDeletionView) {
      commit('UPDATE_addDesign', design)
    }
    const response = await designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', designApis.getAssetIndex(design), '', '0')
    return response.data.data.msg
  },
  async recoverDesigns({ commit, getters }, designs: IDesign[]) {
    if (getters.getCurrLocation === 't') {
      for (const design of designs) {
        commit('UPDATE_deleteDesign', design)
      }
    } else if (getters.getInDeletionView) {
      for (const design of designs) {
        commit('UPDATE_addDesign', design)
      }
    }
    const response = await designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', designApis.getAssetIndices(designs), '', '0')
    return response.data.data.msg
  },
  async deleteDesignForever({ commit }, design: IDesign) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', designApis.getAssetIndex(design), '', '2')
    commit('UPDATE_deleteDesign', design)
  },
  async deleteDesignsForever({ commit }, designs: IDesign[]) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', designApis.getAssetIndices(designs), '', '2')
    for (const design of designs) {
      commit('UPDATE_deleteDesign', design)
    }
  },
  async moveDesign({ commit, getters }, { design, destination }: {design: IDesign, destination: string[]}) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'move', designApis.getAssetIndex(design), null, destination.slice(1).join(','))
    if (getters.getCurrLocation.startsWith('f') && getters.getCurrLocation !== `f:${destination.join('/')}`) {
      commit('UPDATE_deleteDesign', design)
    }
  },
  async moveDesigns({ commit, getters }, { designs, destination }: {designs: IDesign[], destination: string[]}) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'move', designApis.getAssetIndices(designs), null, destination.slice(1).join(','))
    if (getters.getCurrLocation.startsWith('f') && getters.getCurrLocation !== `f:${destination.join('/')}`) {
      for (const design of designs) {
        commit('UPDATE_deleteDesign', design)
      }
    }
  },
  async setFolderName({ commit, getters }, { folder, name, fromFolderItem }: { folder: IFolder, name: string, fromFolderItem: boolean }) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'rename', null, folder.id, name)
    folder.name = name
    if (fromFolderItem) {
      commit('UPDATE_deleteFolder', folder)
      commit('UPDATE_addFolder', folder)
    }
  },
  async moveFolder({ commit, getters }, { folder, destination }: {folder: IDesign, destination: string[]}) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'move', null, folder.id, destination.slice(1).join(','))
    if (getters.getCurrLocation.startsWith('f') && getters.getCurrLocation !== `f:${destination.join('/')}`) {
      commit('UPDATE_deleteFolder', folder)
    }
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
    let targetPath
    switch (currLocation) {
      case 'a':
        targetPath = '/mydesign/all'
        break
      case 'h':
        targetPath = '/mydesign/favor'
        break
      case 't':
        targetPath = '/mydesign/trash'
        break
      default:
        targetPath = `/mydesign/${designUtils.makePath(currLocation).slice(1).join('&')}`
    }
    if (router.currentRoute.path === targetPath) return
    router.replace({ path: targetPath })
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
  SET_allFolders(state: IDesignState, folders: IFolder[]) {
    state.allFolders = folders
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
  SET_isDesignsLoading(state: IDesignState, isDesignsLoading: boolean) {
    state.isDesignsLoading = isDesignsLoading
  },
  SET_isFoldersLoading(state: IDesignState, isFoldersLoading: boolean) {
    state.isFoldersLoading = isFoldersLoading
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
  UPDATE_currLocation(state: IDesignState) {
    const folders = generalUtils.deepCopy(state.folders)
    designUtils.locateTo(folders, state.currLocation)
    state.folders = folders
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
  UPDATE_addFolder(state: IDesignState, folder: IFolder) {
    const index = designUtils.getInsertIndex(state.allFolders, state.sortByField, state.sortByDescending, folder)
    state.allFolders.splice(index, 0, folder)
  },
  UPDATE_deleteFolder(state: IDesignState, folder: IFolder) {
    const index = state.allFolders.findIndex(folder_ => folder_.id === folder.id)
    if (index >= 0) {
      state.inDeletionView = true
      state.allFolders.splice(index, 1)
    }
  },
  UPDATE_removeFolder(state: IDesignState, pathedFolder: IPathedFolder) {
    const targetFolder = designUtils.search(state.folders, pathedFolder.parents)
    if (targetFolder) {
      const index = targetFolder.subFolders.findIndex(folder_ => folder_.id === pathedFolder.folder.id)
      if (index >= 0) {
        targetFolder.subFolders.splice(index, 1)
      }
    }
  },
  UPDATE_insertFolder(state: IDesignState, pathedFolder: IPathedFolder) {
    const targetFolder = designUtils.search(state.folders, pathedFolder.parents)
    if (targetFolder) {
      targetFolder.subFolders.push(pathedFolder.folder)
    }
  },
  UPDATE_addToSelection(state: IDesignState, design: IDesign) {
    Vue.set(state.selectedDesigns, design.id, design)
  },
  UPDATE_removeFromSelection(state: IDesignState, design: IDesign) {
    Vue.delete(state.selectedDesigns, design.id)
  },
  UPDATE_addFolderToSelection(state: IDesignState, folder: IFolder) {
    Vue.set(state.selectedFolders, folder.id, folder)
  },
  UPDATE_removeFolderFromSelection(state: IDesignState, folder: IFolder) {
    Vue.delete(state.selectedFolders, folder.id)
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
