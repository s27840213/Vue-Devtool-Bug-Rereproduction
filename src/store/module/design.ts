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
  moveToFolderSelectInfo: string,
  folders: IFolder[],
  copiedFolders: IFolder[],
  allDesigns: IDesign[],
  allFolders: IFolder[],
  draggingType: 'design' | 'folder' | '',
  draggingDesign: IDesign | undefined,
  draggingFolder: IPathedFolder | undefined,
  selectedDesigns: {[key: string]: IDesign},
  selectedFolders: {[key: string]: IFolder},
  isDesignsLoading: boolean,
  isFoldersLoading: boolean,
  sortByField: string,
  sortByDescending: boolean,
  designsPageIndex: number
}

const getDefaultState = (): IDesignState => ({
  currLocation: '',
  moveToFolderSelectInfo: '',
  folders: [],
  copiedFolders: [],
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
  designsPageIndex: 0
})

const state = getDefaultState()
const getters: GetterTree<IDesignState, unknown> = {
  getCurrLocation(state: IDesignState): string {
    return state.currLocation
  },
  getMoveToFolderSelectInfo(state: IDesignState): string {
    return state.moveToFolderSelectInfo
  },
  getFolders(state: IDesignState): IFolder[] {
    return state.folders
  },
  getCopiedFolders(state: IDesignState): IFolder[] {
    return state.copiedFolders
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
  getDesignsPageIndex(state: IDesignState): number {
    return state.designsPageIndex
  }
}

const actions: ActionTree<IDesignState, unknown> = {
  async fetchDesigns({ commit, getters }, { path }) {
    const { getSortByField, getSortByDescending } = getters
    try {
      const { data } = await designApis.getDesigns(designApis.getToken(), path, 0, getSortByField, getSortByDescending)
      commit('SET_designsPageIndex', data.next_page)
      const designs = data.data.design.content.map((design: IUserDesignContentData) => {
        return designUtils.apiDesign2IDesign(design)
      })
      commit('SET_allDesigns', designs)
    } catch (error) {
      console.log(error)
    }
  },
  async fetchMoreDesigns({ commit, getters }, { path }) {
    const pageIndex = getters.getDesignsPageIndex
    if (pageIndex < 0) return
    const { getSortByField, getSortByDescending } = getters
    try {
      const { data } = await designApis.getDesigns(designApis.getToken(), path, 0, getSortByField, getSortByDescending, {
        page_index: pageIndex
      })
      commit('SET_designsPageIndex', data.next_page)
      const designs = data.data.design.content.map((design: IUserDesignContentData) => {
        return designUtils.apiDesign2IDesign(design)
      })
      commit('SET_allDesigns', getters.getAllDesigns.concat(designs))
    } catch (error) {
      console.log(error)
    }
  },
  async fetchPageFolders({ getters }, { path, pageIndex }) {
    const { getSortByField, getSortByDescending } = getters
    const { data } = await designApis.getDesigns(designApis.getToken(), path, 1, getSortByField, getSortByDescending, {
      page_index: pageIndex
    })
    return data
  },
  async fetchFolders({ dispatch }, { path }) {
    let nextPage = 0
    let folders: IFolder[] = []
    while (nextPage >= 0) {
      try {
        const data = await dispatch('fetchPageFolders', { path, pageIndex: nextPage })
        folders = folders.concat(data.data.design.folder.map((folder: IUserFolderContentData) => {
          return designUtils.apiFolder2IFolder(folder)
        }))
        nextPage = data.next_page
      } catch (error) {
        console.log(error)
      }
    }
    return folders
  },
  async fetchStructuralFolders({ commit, dispatch }, { path }) {
    const folders = await dispatch('fetchFolders', { path })
    commit('UPDATE_folders', {
      path,
      folders: folders ?? []
    })
    return folders === undefined
  },
  async fetchCopiedStructuralFolders({ commit, dispatch }, { path }) {
    const folders = await dispatch('fetchFolders', { path })
    commit('UPDATE_copiedFolders', {
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
        return false
      }
      path.push(node)
      await dispatch('fetchStructuralFolders', { path: path.join(',') })
      currentFolder = currentFolder.subFolders[index]
      commit('SET_expand', {
        path: [designUtils.ROOT, ...path],
        isExpanded: true
      })
    }
    return true
  },
  async fetchTrashFolders({ commit, dispatch }) {
    const folders = (await dispatch('fetchFolders', { path: 'trash' })) ?? []
    commit('SET_allFolders', folders)
  },
  async fetchFolderFolders({ commit, dispatch }, { path }) {
    const folders = (await dispatch('fetchFolders', { path })) ?? []
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
  async fetchFolderDesigns({ dispatch }, { path }) {
    await dispatch('fetchDesigns', { path })
  },
  async fetchMoreAllDesigns({ dispatch }) {
    await dispatch('fetchMoreDesigns', { path: '' })
  },
  async fetchMoreFavoriteDesigns({ dispatch }) {
    await dispatch('fetchMoreDesigns', { path: 'favor' })
  },
  async fetchMoreTrashDesigns({ dispatch }) {
    await dispatch('fetchMoreDesigns', { path: 'trash' })
  },
  async fetchMoreFolderDesigns({ dispatch }, { path }) {
    await dispatch('fetchMoreDesigns', { path })
  },
  async fetchAllExpandedFolders({ dispatch, getters }) {
    const folders = getters.getFolders
    await dispatch('fetchStructuralFolders', { path: 'root' })
    const expandedFolders: IPathedFolder[] = [{
      parents: [],
      folder: folders[0]
    }]
    while (expandedFolders.length > 0) {
      const expandedFolder = expandedFolders.shift()
      if (!expandedFolder) break
      const { parents, folder } = expandedFolder
      for (const subFolder of folder.subFolders) {
        if (subFolder.isExpanded) {
          const newParents = designUtils.appendPath(parents, subFolder)
          expandedFolders.push({
            parents: newParents,
            folder: subFolder
          })
          await dispatch('fetchStructuralFolders', { path: newParents.join(',') })
        }
      }
    }
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
  async recoverDesign({ commit, dispatch, getters }, { design, deletionLocation }: {design: IDesign, deletionLocation?: string}) {
    const response = await designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', designApis.getAssetIndex(design), '', '0')
    if (deletionLocation !== undefined) {
      if (getters.getCurrLocation === deletionLocation) {
        commit('UPDATE_addDesign', design)
      } else if (getters.getCurrLocation === 't') {
        commit('UPDATE_deleteDesign', design)
      }
    } else {
      switch (getters.getCurrLocation) {
        case 't':
          commit('UPDATE_deleteDesign', design)
          break
        case 'a':
          await dispatch('fetchAllDesigns')
          break
        case 'h':
          await dispatch('fetchFavoriteDesigns')
          break
        default:
          await dispatch('fetchFolderDesigns', { path: designUtils.makePath(getters.getCurrLocation).slice(1).join(',') })
      }
    }
    return response.data.data.msg
  },
  async recoverAll({ commit, getters }, { designs, folders }: {designs: IDesign[], folders: IFolder[]}) {
    const response = await designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', designApis.getAssetIndices(designs), designApis.getFolderIds(folders), '0')
    switch (getters.getCurrLocation) {
      case 't': // currently the only possible one
        for (const design of designs) {
          commit('UPDATE_deleteDesign', design)
        }
        for (const folder of folders) {
          commit('UPDATE_deleteFolder', folder)
        }
        break
    }
    return response.data.data.msg
  },
  async deleteDesignForever({ commit }, design: IDesign) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', designApis.getAssetIndex(design), '', '2')
    commit('UPDATE_deleteDesign', design)
  },
  async deleteAllForever({ commit }, { designs, folders }: {designs: IDesign[], folders: IFolder[]}) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', designApis.getAssetIndices(designs), designApis.getFolderIds(folders), '2')
    for (const design of designs) {
      commit('UPDATE_deleteDesign', design)
    }
    for (const folder of folders) {
      commit('UPDATE_deleteFolder', folder)
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
  async createFolder({ commit, getters }, { path, folder, name }: {path: string, folder: IFolder, name: string}) {
    folder.name = name
    const response = await designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'create', null, name, path)
    const newFolder = response.data.data
    const nodes = path === '' ? [] : path.split(',')
    if (newFolder) {
      const newIFolder = designUtils.apiFolder2IFolder(newFolder)
      commit('UPDATE_replaceFolder', {
        parents: [designUtils.ROOT, ...nodes],
        id: folder.id,
        folder: newIFolder
      })
      if (getters.getCurrLocation === `f:${[designUtils.ROOT, ...nodes, folder.id].join('/')}`) {
        commit('SET_currLocation', `f:${[designUtils.ROOT, ...nodes, newIFolder.id].join('/')}`)
      }
    } else {
      commit('UPDATE_removeFolder', {
        parents: [designUtils.ROOT, ...nodes],
        folder
      })
      commit('UPDATE_deleteFolder', folder)
      if (getters.getCurrLocation === `f:${[designUtils.ROOT, ...nodes, folder.id].join('/')}`) {
        commit('SET_currLocation', 'a')
      }
    }
  },
  async setFolderName({ commit }, { folder, name, fromFolderItem }: {folder: IFolder, name: string, fromFolderItem: boolean}) {
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
    if (getters.getCurrLocation.startsWith('f')) {
      if (getters.getCurrLocation === `f:${destination.join('/')}`) {
        commit('UPDATE_addFolder', folder)
      } else {
        commit('UPDATE_deleteFolder', folder)
      }
    }
  },
  async deleteFolder({ commit, dispatch, getters }, pathedFolder: IPathedFolder) {
    await designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', null, pathedFolder.folder.id, '1')
    if (getters.getCurrLocation.startsWith('f') && getters.getCurrLocation === `f:${pathedFolder.parents.join('/')}`) {
      commit('UPDATE_deleteFolder', pathedFolder.folder)
    }
    if (getters.getCurrLocation === 't') {
      commit('UPDATE_addFolder', pathedFolder.folder)
    }
    dispatch('fetchStructuralFolders', { path: pathedFolder.parents.length === 1 ? 'root' : pathedFolder.parents.slice(1).join(',') })
  },
  async checkEmpty({ commit }, pathedFolder: IPathedFolder) {
    const { data } = await designApis.getDesigns(designApis.getToken(), designUtils.createPath(pathedFolder).slice(1).join(','),
      2, 'update', true)
    const holder = data.data.design
    return (holder.content.length + holder.folder.length) === 0
  },
  async recoverFolder({ commit, dispatch, getters }, { folder, deletionLocation }: {folder: IFolder, deletionLocation?: string }) {
    const response = await designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', '', folder.id, '0')
    if (deletionLocation !== undefined) {
      if (getters.getCurrLocation === deletionLocation) {
        commit('UPDATE_addFolder', folder)
      } else if (getters.getCurrLocation === 't') {
        commit('UPDATE_deleteFolder', folder)
      }
    } else {
      switch (getters.getCurrLocation) {
        case 't':
          commit('UPDATE_deleteFolder', folder)
          break
        default:
          await dispatch('fetchFolderFolders', { path: designUtils.makePath(getters.getCurrLocation).slice(1).join(',') })
      }
    }
    dispatch('fetchAllExpandedFolders')
    return response.data.data.msg
  },
  async deleteFolderForever({ commit }, folder: IFolder) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', '', folder.id, '2')
    commit('UPDATE_deleteFolder', folder)
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
  SET_moveToFolderSelectInfo(state: IDesignState, selectInfo: string) {
    const folders = generalUtils.deepCopy(state.copiedFolders)
    designUtils.dislocateFrom(folders, state.moveToFolderSelectInfo)
    designUtils.locateTo(folders, selectInfo)
    state.moveToFolderSelectInfo = selectInfo
    state.copiedFolders = folders
  },
  SET_expand(state: IDesignState, updateInfo: {path: string[], isExpanded: boolean}) {
    const targetFolder = designUtils.search(state.folders, updateInfo.path)
    if (targetFolder) {
      targetFolder.isExpanded = updateInfo.isExpanded
    }
  },
  SET_copiedExpand(state: IDesignState, updateInfo: {path: string[], isExpanded: boolean}) {
    const targetFolder = designUtils.search(state.copiedFolders, updateInfo.path)
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
  SET_designsPageIndex(state: IDesignState, designsPageIndex: number) {
    state.designsPageIndex = designsPageIndex
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
  UPDATE_copiedFolders(state: IDesignState, updateInfo: {path: string, folders: IFolder[]}) {
    const pathNodes = updateInfo.path.split(',')
    const targetFolder = designUtils.search(state.copiedFolders, pathNodes)
    if (targetFolder) {
      targetFolder.subFolders = designUtils.updateFolders(targetFolder.subFolders, updateInfo.folders)
    }
  },
  UPDATE_snapshotFolders(state: IDesignState) {
    const copiedFolders = generalUtils.deepCopy(state.folders)
    const root = copiedFolders[0]
    if (root) {
      designUtils.dislocateFrom(copiedFolders, state.currLocation)
      state.copiedFolders = root.subFolders
    } else {
      state.copiedFolders = []
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
  UPDATE_replaceFolder(state: IDesignState, updateInfo: {parents: string[], id: string, folder: IFolder}) {
    const index = state.allFolders.findIndex((folder_) => folder_.id === updateInfo.id)
    if (index >= 0) {
      state.allFolders.splice(index, 1, updateInfo.folder)
    }
    const targetFolder = designUtils.search(state.folders, updateInfo.parents)
    if (targetFolder) {
      const index = targetFolder.subFolders.findIndex((folder_) => folder_.id === updateInfo.id)
      targetFolder.subFolders.splice(index, 1, updateInfo.folder)
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
