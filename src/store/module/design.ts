import { IDesign, IFolder, IPathedFolder } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import generalUtils from '@/utils/generalUtils'
import designApis from '@/apis/design'
import { GetterTree, MutationTree, ActionTree } from 'vuex'
import Vue from 'vue'
import router from '@/router'
import { IUserDesignContentData, IUserFolderContentData } from '@/interfaces/api'

/**
 * @Vue3Update - Reviewer: TingAn
 * Bcz Vue.set and Vue.delete is remove in Vue3, I have change it to the corresponding syntax but don't know how to verify all functionalities, I need U help Bro.
 */

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
  selectedDesigns: { [key: string]: IDesign },
  selectedFolders: { [key: string]: IFolder },
  isDesignsLoading: boolean,
  isFoldersLoading: boolean,
  sortByField: string,
  sortByDescending: boolean,
  designsPageIndex: number,
  isErrorShowing: boolean,
  folderDesignCount: number,
  folderFolderCount: number,
  bottomMenu: string,
  mobileDesignBuffer: IDesign | undefined,
  mobileFolderBuffer: IPathedFolder | undefined,
  mobilePathBuffer: string[]
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
  designsPageIndex: 0,
  isErrorShowing: false,
  folderDesignCount: 0,
  folderFolderCount: 0,
  bottomMenu: '',
  mobileDesignBuffer: undefined,
  mobileFolderBuffer: undefined,
  mobilePathBuffer: []
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
  getSelectedDesigns(state: IDesignState): { [key: string]: IDesign } {
    return state.selectedDesigns
  },
  getSelectedFolders(state: IDesignState): { [key: string]: IFolder } {
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
  },
  getIsErrorShowing(state: IDesignState): boolean {
    return state.isErrorShowing
  },
  getItemCount(state: IDesignState): number {
    return state.folderDesignCount + state.folderFolderCount
  },
  getBottomMenu(state: IDesignState): string {
    return state.bottomMenu
  },
  getMobileDesignBuffer(state: IDesignState): IDesign | undefined {
    return state.mobileDesignBuffer
  },
  getMobileFolderBuffer(state: IDesignState): IPathedFolder | undefined {
    return state.mobileFolderBuffer
  },
  getMobilePathBuffer(state: IDesignState): string[] {
    return state.mobilePathBuffer
  }
}

const actions: ActionTree<IDesignState, unknown> = {
  async fetchDesign({ commit, getters }, { teamId, assetId }) {
    try {
      const { data } = await designApis.getDesign(teamId, assetId)
      return data
    } catch (error) {
      console.error(error)
    }
  },
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
      console.error(error)
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
      console.error(error)
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
        console.error(error)
        nextPage = -1
      }
    }
    return folders
  },
  async fetchItemCount({ commit }, { path }) {
    try {
      commit('SET_itemCount', {
        designCount: -1,
        folderCount: -1
      })
      const { data } = await designApis.getDesigns(designApis.getToken(), path, 3, 'update', true)
      commit('SET_itemCount', {
        designCount: data.data.design.file_count,
        folderCount: data.data.design.folder_count
      })
    } catch (error) {
      console.error(error)
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
    newDesign.asset_index = -1
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'copy', designApis.getAssetIndex(design), null, '')
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          commit('UPDATE_deleteDesign', newDesign)
          commit('SET_isErrorShowing', true)
          return
        }
        commit('UPDATE_replaceDesign', {
          id: newId,
          design: designUtils.apiDesign2IDesign(response.data.data)
        })
      }).catch((error) => {
        console.error(error)
        commit('UPDATE_deleteDesign', newDesign)
        commit('SET_isErrorShowing', true)
      })
    commit('UPDATE_addDesign', newDesign)
  },
  async favorDesign({ commit }, design: IDesign) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'favor', designApis.getAssetIndex(design), null, '1')
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          design.favorite = false
          commit('SET_isErrorShowing', true)
        }
      }).catch((error) => {
        console.error(error)
        design.favorite = false
        commit('SET_isErrorShowing', true)
      })
    design.favorite = true
  },
  async favorDesigns({ commit }, designs: IDesign[]) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'favor', designApis.getAssetIndices(designs), null, '1')
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          for (const design of designs) {
            design.favorite = false
          }
          commit('SET_isErrorShowing', true)
        }
      }).catch((error) => {
        console.error(error)
        for (const design of designs) {
          design.favorite = false
        }
        commit('SET_isErrorShowing', true)
      })
    for (const design of designs) {
      design.favorite = true
    }
  },
  async unfavorDesign({ commit, getters }, design: IDesign) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'favor', designApis.getAssetIndex(design), null, '0')
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          design.favorite = true
          if (getters.getCurrLocation === 'h') {
            commit('UPDATE_addDesign', design)
          }
          commit('SET_isErrorShowing', true)
        }
      }).catch((error) => {
        console.error(error)
        design.favorite = true
        if (getters.getCurrLocation === 'h') {
          commit('UPDATE_addDesign', design)
        }
        commit('SET_isErrorShowing', true)
      })
    design.favorite = false
    if (getters.getCurrLocation === 'h') {
      commit('UPDATE_deleteDesign', design)
    }
  },
  async unfavorDesigns({ commit, getters }, designs: IDesign[]) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'favor', designApis.getAssetIndices(designs), null, '0')
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          const inFavoriteView = getters.getCurrLocation === 'h'
          for (const design of designs) {
            design.favorite = true
            if (inFavoriteView) {
              commit('UPDATE_addDesign', design)
            }
          }
          commit('SET_isErrorShowing', true)
        }
      }).catch((error) => {
        console.error(error)
        const inFavoriteView = getters.getCurrLocation === 'h'
        for (const design of designs) {
          design.favorite = true
          if (inFavoriteView) {
            commit('UPDATE_addDesign', design)
          }
        }
        commit('SET_isErrorShowing', true)
      })
    const inFavoriteView = getters.getCurrLocation === 'h'
    for (const design of designs) {
      design.favorite = false
      if (inFavoriteView) {
        commit('UPDATE_deleteDesign', design)
      }
    }
  },
  async setDesignName({ commit }, { design, name }: { design: IDesign, name: string }) {
    const originalName = design.name
    const originalUpdateTime = design.lastUpdatedTime
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'rename', designApis.getAssetIndex(design), null, name)
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          design.name = originalName
          design.lastUpdatedTime = originalUpdateTime
          commit('UPDATE_deleteDesign', design)
          commit('UPDATE_addDesign', design)
          commit('SET_isErrorShowing', true)
        }
      }).catch((error) => {
        console.error(error)
        design.name = originalName
        design.lastUpdatedTime = originalUpdateTime
        commit('UPDATE_deleteDesign', design)
        commit('UPDATE_addDesign', design)
        commit('SET_isErrorShowing', true)
      })
    design.name = name
    design.lastUpdatedTime = (new Date()).toISOString()
    commit('UPDATE_deleteDesign', design)
    commit('UPDATE_addDesign', design)
  },
  async deleteDesign({ commit }, design: IDesign) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', designApis.getAssetIndex(design), null, '1')
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          commit('UPDATE_addDesign', design)
          commit('SET_isErrorShowing', true)
        }
      }).catch((error) => {
        console.error(error)
        commit('UPDATE_addDesign', design)
        commit('SET_isErrorShowing', true)
      })
    commit('UPDATE_deleteDesign', design)
  },
  async deleteDesigns({ commit }, designs: IDesign[]) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', designApis.getAssetIndices(designs), null, '1')
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          for (const design of designs) {
            commit('UPDATE_addDesign', design)
          }
          commit('SET_isErrorShowing', true)
        }
      }).catch((error) => {
        console.error(error)
        for (const design of designs) {
          commit('UPDATE_addDesign', design)
        }
        commit('SET_isErrorShowing', true)
      })
    for (const design of designs) {
      commit('UPDATE_deleteDesign', design)
    }
  },
  async recoverDesign({ commit, dispatch, getters }, { design, deletionLocation }: { design: IDesign, deletionLocation?: string }) {
    if (deletionLocation !== undefined) {
      if (getters.getCurrLocation === deletionLocation) {
        commit('UPDATE_addDesign', design)
      } else if (getters.getCurrLocation === 't') {
        commit('UPDATE_deleteDesign', design)
      }
    } else {
      switch (getters.getCurrLocation) {
        case 't': // currently the only possible one
          commit('UPDATE_deleteDesign', design)
          break
      }
    }
    try {
      const response = await designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
        'delete', designApis.getAssetIndex(design), '', '0')
      if (response.data.flag !== 0) {
        console.log(response.data.msg)
        if (deletionLocation !== undefined) {
          if (getters.getCurrLocation === deletionLocation) {
            commit('UPDATE_deleteDesign', design)
          } else if (getters.getCurrLocation === 't') {
            commit('UPDATE_addDesign', design)
          }
        } else {
          switch (getters.getCurrLocation) {
            case 't': // currently the only possible one
              commit('UPDATE_addDesign', design)
              break
          }
        }
        commit('SET_isErrorShowing', true)
        return ''
      }
      return response.data.data.msg
    } catch (error) {
      console.error(error)
      if (deletionLocation !== undefined) {
        if (getters.getCurrLocation === deletionLocation) {
          commit('UPDATE_deleteDesign', design)
        } else if (getters.getCurrLocation === 't') {
          commit('UPDATE_addDesign', design)
        }
      } else {
        switch (getters.getCurrLocation) {
          case 't': // currently the only possible one
            commit('UPDATE_addDesign', design)
            break
        }
      }
      commit('SET_isErrorShowing', true)
      return ''
    }
  },
  async recoverAll({ commit, dispatch, getters }, { designs, folders }: { designs: IDesign[], folders: IFolder[] }) {
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
    try {
      const response = await designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
        'delete', designApis.getAssetIndices(designs), designApis.getFolderIds(folders), '0')
      if (response.data.flag !== 0) {
        console.log(response.data.msg)
        switch (getters.getCurrLocation) {
          case 't': // currently the only possible one
            for (const design of designs) {
              commit('UPDATE_addDesign', design)
            }
            for (const folder of folders) {
              commit('UPDATE_addFolder', folder)
            }
            break
        }
        commit('SET_isErrorShowing', true)
        return ''
      }
      if (folders.length > 0) {
        dispatch('fetchAllExpandedFolders')
      }
      return response.data.data.msg
    } catch (error) {
      console.error(error)
      switch (getters.getCurrLocation) {
        case 't': // currently the only possible one
          for (const design of designs) {
            commit('UPDATE_addDesign', design)
          }
          for (const folder of folders) {
            commit('UPDATE_addFolder', folder)
          }
          break
      }
      commit('SET_isErrorShowing', true)
      return ''
    }
  },
  async deleteDesignForever({ commit }, design: IDesign) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', designApis.getAssetIndex(design), '', '2')
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          commit('UPDATE_addDesign', design)
          commit('SET_isErrorShowing', true)
        }
      }).catch((error) => {
        console.error(error)
        commit('UPDATE_addDesign', design)
        commit('SET_isErrorShowing', true)
      })
    commit('UPDATE_deleteDesign', design)
  },
  async deleteAllForever({ commit }, { designs, folders }: { designs: IDesign[], folders: IFolder[] }) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', designApis.getAssetIndices(designs), designApis.getFolderIds(folders), '2')
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          for (const design of designs) {
            commit('UPDATE_addDesign', design)
          }
          for (const folder of folders) {
            commit('UPDATE_addFolder', folder)
          }
          commit('SET_isErrorShowing', true)
        }
      }).catch((error) => {
        console.error(error)
        for (const design of designs) {
          commit('UPDATE_addDesign', design)
        }
        for (const folder of folders) {
          commit('UPDATE_addFolder', folder)
        }
        commit('SET_isErrorShowing', true)
      })
    for (const design of designs) {
      commit('UPDATE_deleteDesign', design)
    }
    for (const folder of folders) {
      commit('UPDATE_deleteFolder', folder)
    }
  },
  async moveDesign({ commit, getters }, { design, destination }: { design: IDesign, destination: string[] }) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'move', designApis.getAssetIndex(design), null, destination.slice(1).join(','))
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          if (getters.getCurrLocation.startsWith('f') && getters.getCurrLocation !== `f:${destination.join('/')}`) {
            commit('UPDATE_addDesign', design)
          }
          commit('SET_isErrorShowing', true)
        }
      }).catch((error) => {
        console.error(error)
        if (getters.getCurrLocation.startsWith('f') && getters.getCurrLocation !== `f:${destination.join('/')}`) {
          commit('UPDATE_addDesign', design)
        }
        commit('SET_isErrorShowing', true)
      })
    if (getters.getCurrLocation.startsWith('f') && getters.getCurrLocation !== `f:${destination.join('/')}`) {
      commit('UPDATE_deleteDesign', design)
    }
  },
  async moveDesigns({ commit, getters }, { designs, destination }: { designs: IDesign[], destination: string[] }) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'move', designApis.getAssetIndices(designs), null, destination.slice(1).join(','))
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          if (getters.getCurrLocation.startsWith('f') && getters.getCurrLocation !== `f:${destination.join('/')}`) {
            for (const design of designs) {
              commit('UPDATE_addDesign', design)
            }
          }
          commit('SET_isErrorShowing', true)
        }
      }).catch((error) => {
        console.error(error)
        if (getters.getCurrLocation.startsWith('f') && getters.getCurrLocation !== `f:${destination.join('/')}`) {
          for (const design of designs) {
            commit('UPDATE_addDesign', design)
          }
        }
        commit('SET_isErrorShowing', true)
      })
    if (getters.getCurrLocation.startsWith('f') && getters.getCurrLocation !== `f:${destination.join('/')}`) {
      for (const design of designs) {
        commit('UPDATE_deleteDesign', design)
      }
    }
  },
  async createFolder({ commit, getters }, { path, folder, name }: { path: string, folder: IFolder, name: string }) {
    folder.name = name
    let newFolder
    try {
      const response = await designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
        'create', null, name, path)
      newFolder = response.data.data
    } catch (error) {
      console.error(error)
      newFolder = undefined
    }
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
      commit('SET_isErrorShowing', true)
    }
  },
  async setFolderName({ commit }, { folder, name, parents }: { folder: IFolder, name: string, parents: string[] }) {
    const originalName = folder.name
    const originalUpdateTime = folder.lastUpdatedTime
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'rename', null, folder.id, name)
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          commit('UPDATE_setFolderName', {
            parents,
            folder,
            name: originalName,
            lastUpdatedTime: originalUpdateTime
          })
          commit('SET_isErrorShowing', true)
        }
      }).catch((error) => {
        console.error(error)
        commit('UPDATE_setFolderName', {
          parents,
          folder,
          name: originalName,
          lastUpdatedTime: originalUpdateTime
        })
        commit('SET_isErrorShowing', true)
      })
    commit('UPDATE_setFolderName', {
      parents,
      folder,
      name,
      lastUpdatedTime: (new Date()).toISOString()
    })
  },
  async moveFolder({ commit, getters }, { parents, folder, destination }: { parents: string[], folder: IDesign, destination: string[] }) {
    const originalPath = parents
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'move', null, folder.id, destination.slice(1).join(','))
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          if (getters.getCurrLocation === `f:${destination.join('/')}`) {
            commit('UPDATE_deleteFolder', folder)
          } else if (getters.getCurrLocation === `f:${originalPath.join('/')}` || (getters.getCurrLocation === 'l' && originalPath.length === 1)) {
            commit('UPDATE_addFolder', folder)
          }
          commit('UPDATE_removeFolder', {
            parents: destination,
            folder: folder
          })
          commit('UPDATE_insertFolder', { parents, folder })
          commit('SET_isErrorShowing', true)
        }
      }).catch((error) => {
        console.error(error)
        if (getters.getCurrLocation === `f:${destination.join('/')}`) {
          commit('UPDATE_deleteFolder', folder)
        } else if (getters.getCurrLocation === `f:${originalPath.join('/')}` || (getters.getCurrLocation === 'l' && originalPath.length === 1)) {
          commit('UPDATE_addFolder', folder)
        }
        commit('UPDATE_removeFolder', {
          parents: destination,
          folder: folder
        })
        commit('UPDATE_insertFolder', { parents, folder })
        commit('SET_isErrorShowing', true)
      })
    if (getters.getCurrLocation === `f:${destination.join('/')}`) {
      commit('UPDATE_addFolder', folder)
    } else if (getters.getCurrLocation === `f:${originalPath.join('/')}` || (getters.getCurrLocation === 'l' && originalPath.length === 1)) {
      commit('UPDATE_deleteFolder', folder)
    }
    commit('UPDATE_removeFolder', { parents, folder })
    commit('UPDATE_insertFolder', {
      parents: destination,
      folder: folder
    })
  },
  async deleteFolder({ commit, dispatch, getters }, pathedFolder: IPathedFolder) {
    if (
      (getters.getCurrLocation.startsWith('f') && getters.getCurrLocation === `f:${pathedFolder.parents.join('/')}`) ||
      (getters.getCurrLocation === 'l' && pathedFolder.parents.length === 1)
    ) {
      commit('UPDATE_deleteFolder', pathedFolder.folder)
    }
    if (getters.getCurrLocation === 't') {
      commit('UPDATE_addFolder', pathedFolder.folder)
    }
    await designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', null, pathedFolder.folder.id, '1')
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          if (
            (getters.getCurrLocation.startsWith('f') && getters.getCurrLocation === `f:${pathedFolder.parents.join('/')}`) ||
            (getters.getCurrLocation === 'l' && pathedFolder.parents.length === 1)
          ) {
            commit('UPDATE_addFolder', pathedFolder.folder)
          }
          if (getters.getCurrLocation === 't') {
            commit('UPDATE_deleteFolder', pathedFolder.folder)
          }
          commit('SET_isErrorShowing', true)
        }
      }).catch((error) => {
        console.error(error)
        if (
          (getters.getCurrLocation.startsWith('f') && getters.getCurrLocation === `f:${pathedFolder.parents.join('/')}`) ||
          (getters.getCurrLocation === 'l' && pathedFolder.parents.length === 1)
        ) {
          commit('UPDATE_addFolder', pathedFolder.folder)
        }
        if (getters.getCurrLocation === 't') {
          commit('UPDATE_deleteFolder', pathedFolder.folder)
        }
        commit('SET_isErrorShowing', true)
      })
    dispatch('fetchStructuralFolders', { path: pathedFolder.parents.length === 1 ? 'root' : pathedFolder.parents.slice(1).join(',') })
  },
  async checkEmpty({ commit }, pathedFolder: IPathedFolder) {
    const { data } = await designApis.getDesigns(designApis.getToken(), designUtils.createPath(pathedFolder).slice(1).join(','),
      2, 'update', true)
    const holder = data.data?.design
    if (!holder) {
      commit('SET_isErrorShowing', true)
      return true
    }
    return (holder.content.length + holder.folder.length) === 0
  },
  async recoverFolder({ commit, dispatch, getters }, { folder, deletionLocation }: { folder: IFolder, deletionLocation?: string }) {
    if (deletionLocation !== undefined) {
      if (getters.getCurrLocation === deletionLocation) {
        commit('UPDATE_addFolder', folder)
      } else if (getters.getCurrLocation === 't') {
        commit('UPDATE_deleteFolder', folder)
      }
    } else {
      switch (getters.getCurrLocation) {
        case 't': // currently the only possible one
          commit('UPDATE_deleteFolder', folder)
          break
      }
    }
    try {
      const response = await designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
        'delete', '', folder.id, '0')
      if (response.data.flag !== 0) {
        console.log(response.data.msg)
        if (deletionLocation !== undefined) {
          if (getters.getCurrLocation === deletionLocation) {
            commit('UPDATE_deleteFolder', folder)
          } else if (getters.getCurrLocation === 't') {
            commit('UPDATE_addFolder', folder)
          }
        } else {
          switch (getters.getCurrLocation) {
            case 't': // currently the only possible one
              commit('UPDATE_addFolder', folder)
              break
          }
        }
        commit('SET_isErrorShowing', true)
        return ''
      }
      dispatch('fetchAllExpandedFolders')
      return response.data.data.msg
    } catch (error) {
      console.error(error)
      if (deletionLocation !== undefined) {
        if (getters.getCurrLocation === deletionLocation) {
          commit('UPDATE_deleteFolder', folder)
        } else if (getters.getCurrLocation === 't') {
          commit('UPDATE_addFolder', folder)
        }
      } else {
        switch (getters.getCurrLocation) {
          case 't': // currently the only possible one
            commit('UPDATE_addFolder', folder)
            break
        }
      }
      commit('SET_isErrorShowing', true)
      return ''
    }
  },
  async deleteFolderForever({ commit }, folder: IFolder) {
    designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
      'delete', '', folder.id, '2')
      .then((response) => {
        if (response.data.flag !== 0) {
          console.log(response.data.msg)
          commit('UPDATE_addFolder', folder)
          commit('SET_isErrorShowing', true)
        }
      }).catch((error) => {
        console.error(error)
        commit('UPDATE_addFolder', folder)
        commit('SET_isErrorShowing', true)
      })
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
      case 'l':
        targetPath = '/mydesign/list'
        break
      default:
        targetPath = `/mydesign/${designUtils.makePath(currLocation).slice(1).join('&')}`
    }
    if (router.currentRoute.value.path === targetPath) return
    router.replace({ path: targetPath })
  },
  SET_moveToFolderSelectInfo(state: IDesignState, selectInfo: string) {
    const folders = generalUtils.deepCopy(state.copiedFolders)
    designUtils.dislocateFrom(folders, state.moveToFolderSelectInfo)
    designUtils.locateTo(folders, selectInfo)
    state.moveToFolderSelectInfo = selectInfo
    state.copiedFolders = folders
  },
  SET_expand(state: IDesignState, updateInfo: { path: string[], isExpanded: boolean }) {
    const targetFolder = designUtils.search(state.folders, updateInfo.path)
    if (targetFolder) {
      targetFolder.isExpanded = updateInfo.isExpanded
    }
  },
  SET_copiedExpand(state: IDesignState, updateInfo: { path: string[], isExpanded: boolean }) {
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
  SET_isErrorShowing(state: IDesignState, isErrorShowing: boolean) {
    state.isErrorShowing = isErrorShowing
  },
  SET_itemCount(state: IDesignState, updateInfo: { designCount: number, folderCount: number }) {
    state.folderDesignCount = updateInfo.designCount
    state.folderFolderCount = updateInfo.folderCount
  },
  SET_bottomMenu(state: IDesignState, bottomMenu: string) {
    state.bottomMenu = bottomMenu
  },
  SET_mobileDesignBuffer(state: IDesignState, mobileDesignBuffer: IDesign | undefined) {
    state.mobileDesignBuffer = mobileDesignBuffer
  },
  SET_mobileFolderBuffer(state: IDesignState, mobileFolderBuffer: IPathedFolder | undefined) {
    state.mobileFolderBuffer = mobileFolderBuffer
  },
  SET_mobilePathBuffer(state: IDesignState, mobilePathBuffer: string[]) {
    state.mobilePathBuffer = mobilePathBuffer
  },
  UPDATE_setDesignThumbnail(state: IDesignState, updateInfo: { id: string, thumbnail: string }) {
    const design = state.allDesigns.find((design) => design.id === updateInfo.id)
    if (design) {
      design.thumbnail = updateInfo.thumbnail
    }
  },
  UPDATE_folders(state: IDesignState, updateInfo: { path: string, folders: IFolder[] }) {
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
  UPDATE_copiedFolders(state: IDesignState, updateInfo: { path: string, folders: IFolder[] }) {
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
    state.moveToFolderSelectInfo = ''
  },
  UPDATE_currLocation(state: IDesignState) {
    const folders = generalUtils.deepCopy(state.folders)
    designUtils.locateTo(folders, state.currLocation)
    state.folders = folders
  },
  UPDATE_addDesign(state: IDesignState, design: IDesign) {
    const index = designUtils.getInsertIndex(state.allDesigns, state.sortByField, state.sortByDescending, design)
    state.allDesigns.splice(index, 0, design)
    state.folderDesignCount += 1
  },
  UPDATE_replaceDesign(state: IDesignState, updateInfo: { id: string, design: IDesign }) {
    const index = state.allDesigns.findIndex((design_) => design_.id === updateInfo.id) // placeholder design uses special id, so replace by id
    state.allDesigns.splice(index, 1, updateInfo.design)
  },
  UPDATE_deleteDesign(state: IDesignState, design: IDesign) {
    const index = state.allDesigns.findIndex((design_) => design_.asset_index === design.asset_index)
    if (index >= 0) {
      state.allDesigns.splice(index, 1)
      state.folderDesignCount -= 1
    }
  },
  UPDATE_setFolderName(state: IDesignState, updateInfo: { name: string, parents: string[], folder: IFolder, lastUpdatedTime: string }) {
    const folder = designUtils.search(state.folders, designUtils.appendPath(updateInfo.parents, updateInfo.folder))
    if (folder) {
      folder.name = updateInfo.name
      folder.lastUpdatedTime = updateInfo.lastUpdatedTime
    }
    const index = state.allFolders.findIndex((folder_) => folder_.id === updateInfo.folder.id)
    if (index >= 0) {
      const newFolder = state.allFolders[index]
      state.allFolders.splice(index, 1)
      newFolder.name = updateInfo.name
      newFolder.lastUpdatedTime = updateInfo.lastUpdatedTime
      const newIndex = designUtils.getInsertIndex(state.allFolders, state.sortByField, state.sortByDescending, newFolder)
      state.allFolders.splice(newIndex, 0, newFolder)
    }
  },
  UPDATE_addFolder(state: IDesignState, folder: IFolder) {
    const index = state.allFolders.findIndex(folder_ => folder_.id === folder.id)
    if (index >= 0) return
    const insertIndex = designUtils.getInsertIndex(state.allFolders, state.sortByField, state.sortByDescending, folder)
    state.allFolders.splice(insertIndex, 0, folder)
    state.folderFolderCount += 1
  },
  UPDATE_deleteFolder(state: IDesignState, folder: IFolder) {
    const index = state.allFolders.findIndex(folder_ => folder_.id === folder.id)
    if (index >= 0) {
      state.allFolders.splice(index, 1)
      state.folderFolderCount -= 1
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
  UPDATE_insertFolderToCopied(state: IDesignState, pathedFolder: IPathedFolder) {
    if (pathedFolder.parents.length === 0) {
      state.copiedFolders.push(pathedFolder.folder)
    } else {
      const targetFolder = designUtils.search(state.copiedFolders, pathedFolder.parents)
      if (targetFolder) {
        targetFolder.subFolders.push(pathedFolder.folder)
      }
    }
  },
  UPDATE_replaceFolder(state: IDesignState, updateInfo: { parents: string[], id: string, folder: IFolder }) {
    const index = state.allFolders.findIndex((folder_) => folder_.id === updateInfo.id)
    if (index >= 0) {
      state.allFolders.splice(index, 1, updateInfo.folder)
    }
    const targetFolder = designUtils.search(state.folders, updateInfo.parents)
    if (targetFolder) {
      const index = targetFolder.subFolders.findIndex((folder_) => folder_.id === updateInfo.id)
      targetFolder.subFolders.splice(index, 1, updateInfo.folder)
    }
    if (updateInfo.parents.length === 1) {
      const index = state.copiedFolders.findIndex((folder_) => folder_.id === updateInfo.id)
      state.copiedFolders.splice(index, 1, updateInfo.folder)
    } else {
      const targetFolder = designUtils.search(state.copiedFolders, updateInfo.parents.slice(1))
      if (targetFolder) {
        const index = targetFolder.subFolders.findIndex((folder_) => folder_.id === updateInfo.id)
        targetFolder.subFolders.splice(index, 1, updateInfo.folder)
      }
    }
  },
  UPDATE_addToSelection(state: IDesignState, design: IDesign) {
    // Vue.set(state.selectedDesigns, design.asset_index.toString(), design)
    state.selectedDesigns[design.asset_index.toString()] = design
  },
  UPDATE_removeFromSelection(state: IDesignState, design: IDesign) {
    // Vue.delete(state.selectedDesigns, design.asset_index.toString())
    delete state.selectedDesigns[design.asset_index.toString()]
  },
  UPDATE_addFolderToSelection(state: IDesignState, folder: IFolder) {
    // Vue.set(state.selectedFolders, folder.id, folder)
    state.selectedFolders[folder.id] = folder
  },
  UPDATE_removeFolderFromSelection(state: IDesignState, folder: IFolder) {
    // Vue.delete(state.selectedFolders, folder.id)
    delete state.selectedFolders[folder.id]
  },
  UPDATE_metaSelect(state: IDesignState, updateInfo: { designs: IDesign[], index: number }) {
    const { designs, index } = updateInfo
    if (Object.keys(state.selectedDesigns).length === 0) {
      // Vue.set(state.selectedDesigns, designs[index].asset_index.toString(), designs[index])
      state.selectedDesigns[designs[index].asset_index.toString()] = designs[index]
    } else {
      let nearestSelectedIndex = -1
      const indexQueue = [[index, 0]]
      while (indexQueue.length) {
        const item = indexQueue.shift()
        if (item === undefined) break
        const [index, mode] = item
        const design = designs[index]
        if (state.selectedDesigns[design.asset_index.toString()]) {
          nearestSelectedIndex = index
          break
        }
        if (mode >= 0 && index + 1 < designs.length) {
          indexQueue.push([index + 1, 1])
        }
        if (mode <= 0 && index - 1 >= 0) {
          indexQueue.push([index - 1, -1])
        }
      }
      state.selectedDesigns = {}
      if (nearestSelectedIndex === -1) { // should not happen, but in case that selectedDesigns contain only designs not in updateInfo.designs
        // Vue.set(state.selectedDesigns, designs[index].asset_index.toString(), designs[index])
        state.selectedDesigns[designs[index].asset_index.toString()] = designs[index]
      } else {
        const [indexFrom, indexTo] = [nearestSelectedIndex, index].sort((a, b) => a - b)
        for (let i = indexFrom; i <= indexTo; i++) {
          // Vue.set(state.selectedDesigns, designs[i].asset_index.toString(), designs[i])
          state.selectedDesigns[designs[i].asset_index.toString()] = designs[i]
        }
      }
    }
  },
  UPDATE_metaSelectFolder(state: IDesignState, updateInfo: { folders: IFolder[], index: number }) {
    const { folders, index } = updateInfo
    if (Object.keys(state.selectedFolders).length === 0) {
      // Vue.set(state.selectedFolders, folders[index].id, folders[index])
      state.selectedFolders[folders[index].id] = folders[index]
    } else {
      let nearestSelectedIndex = -1
      const indexQueue = [[index, 0]]
      while (indexQueue.length) {
        const item = indexQueue.shift()
        if (item === undefined) break
        const [index, mode] = item
        const folder = folders[index]
        if (state.selectedFolders[folder.id]) {
          nearestSelectedIndex = index
          break
        }
        if (mode >= 0 && index + 1 < folders.length) {
          indexQueue.push([index + 1, 1])
        }
        if (mode <= 0 && index - 1 >= 0) {
          indexQueue.push([index - 1, -1])
        }
      }
      state.selectedFolders = {}
      if (nearestSelectedIndex === -1) { // should not happen, but in case that selectedFolders contain only folders not in updateInfo.folders
        // Vue.set(state.selectedFolders, folders[index].id, folders[index])
      } else {
        const [indexFrom, indexTo] = [nearestSelectedIndex, index].sort((a, b) => a - b)
        for (let i = indexFrom; i <= indexTo; i++) {
          // Vue.set(state.selectedFolders, folders[i].id, folders[i])
        }
      }
    }
  },
  UPDATE_clearSelection(state: IDesignState) {
    state.selectedDesigns = {}
    state.selectedFolders = {}
  },
  UPDATE_clearBuffers(state: IDesignState) {
    state.mobileDesignBuffer = undefined
    state.mobileFolderBuffer = undefined
    state.mobilePathBuffer = []
  },
  UPDATE_resetState(state: IDesignState) {
    const defaultState = getDefaultState()
    for (const [key, value] of Object.entries(defaultState)) {
      (state as any)[key] = value
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
