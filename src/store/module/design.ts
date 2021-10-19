import { IDesign, IDraggingDesign, IFolder, IPathedDesign } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import generalUtils from '@/utils/generalUtils'
import { GetterTree, MutationTree } from 'vuex'

interface IDesignSidebarState {
  currentSelectedFolder: string,
  folders: IFolder[],
  draggingDesign: IDraggingDesign | undefined,
  favoriateDesigns: IPathedDesign[],
  trashDesigns: IPathedDesign[]
}

const getDefaultState = (): IDesignSidebarState => ({
  currentSelectedFolder: 'a',
  folders: [],
  draggingDesign: undefined,
  favoriateDesigns: [],
  trashDesigns: []
})

const state = getDefaultState()
const getters: GetterTree<IDesignSidebarState, unknown> = {
  getCurrSelectedFolder(state: IDesignSidebarState): string {
    return state.currentSelectedFolder
  },
  getFolders(state: IDesignSidebarState): IFolder[] {
    return state.folders
  },
  getDesigns(state: IDesignSidebarState, path: string[]): IDesign[] {
    return designUtils.search(state.folders, path)?.designs ?? []
  },
  getDraggingDesign(state: IDesignSidebarState): IDraggingDesign | undefined {
    return state.draggingDesign
  },
  getFavoriateDesigns(state: IDesignSidebarState): IPathedDesign[] {
    return state.favoriateDesigns
  },
  getTrashDesigns(state: IDesignSidebarState): IPathedDesign[] {
    return state.trashDesigns
  }
}

const mutations: MutationTree<IDesignSidebarState> = {
  SET_currSelectedFolder(state: IDesignSidebarState, currentSelectedFolder: string) {
    const folders = generalUtils.deepCopy(state.folders)
    designUtils.deselect(folders, state.currentSelectedFolder)
    designUtils.select(folders, currentSelectedFolder)
    state.currentSelectedFolder = currentSelectedFolder
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
  SET_draggingDesign(state: IDesignSidebarState, draggingDesign: IDraggingDesign) {
    state.draggingDesign = draggingDesign
  },
  UPDATE_addToFavoriate(state: IDesignSidebarState, updateInfo: {path: string[], design: IDesign}) {
    state.favoriateDesigns.push({
      design: updateInfo.design,
      path: updateInfo.path
    })
  },
  UPDATE_addToTrash(state: IDesignSidebarState, updateInfo: {path: string[], design: IDesign}) {
    state.trashDesigns.push({
      design: updateInfo.design,
      path: updateInfo.path
    })
  },
  UPDATE_removeFromFavoriate(state: IDesignSidebarState, updateInfo: {path: string[], design: IDesign}) {
    const index = state.favoriateDesigns.findIndex(pathedDesign => pathedDesign.design.id === updateInfo.design.id)
    if (index >= 0) {
      state.favoriateDesigns.splice(index, 1)
    }
  },
  UPDATE_removeFromTrash(state: IDesignSidebarState, updateInfo: {path: string[], design: IDesign}) {
    const index = state.trashDesigns.findIndex(pathedDesign => pathedDesign.design.id === updateInfo.design.id)
    if (index >= 0) {
      state.trashDesigns.splice(index, 1)
    }
  },
  UPDATE_path(state: IDesignSidebarState, updateInfo: {id: string, path: string[]}) {
    const index = state.favoriateDesigns.findIndex(pathedDesign => pathedDesign.design.id === updateInfo.id)
    if (index >= 0) {
      state.favoriateDesigns[index].path = updateInfo.path
    }
  },
  UPDATE_folderName(state: IDesignSidebarState, updateInfo: {path: string[], newFolderName: string}) {
    const targetFolder = designUtils.search(state.folders, updateInfo.path)
    if (targetFolder) {
      targetFolder.name = updateInfo.newFolderName
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
