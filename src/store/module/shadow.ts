import { SrcObj } from '@/interfaces/gallery'
import { IImageStyle, ILayerIdentifier } from '@/interfaces/layer'
import { GetterTree, MutationTree, ActionTree } from 'vuex'
import { IEditorState } from '../types'

const SET_UPLOAD_ID = 'SET_UPLOAD_ID' as const
const SET_PROCESS_ID = 'SET_PROCESS_ID' as const
const ADD_UPLOAD_IMG = 'ADD_UPLOAD_IMG' as const

export interface IUploadShadowImg {
  id: string,
  owner: ILayerIdentifier,
  srcObj: SrcObj,
  styles: Partial<IImageStyle>
}
interface IShadowState {
  uploadId: ILayerIdentifier,
  processId: ILayerIdentifier,
  uploadShadowImgs: Array<IUploadShadowImg>
}

const getters: GetterTree<IShadowState, IEditorState> = {
  isUploading(state): boolean {
    return state.uploadId.layerId !== '' && state.uploadId.pageId !== ''
  },
  isProcessing(state): boolean {
    return state.processId.layerId !== '' && state.processId.layerId !== ''
  }
}
const state: IShadowState = {
  uploadId: {
    pageId: '',
    layerId: '',
    subLayerId: ''
  },
  processId: {
    pageId: '',
    layerId: '',
    subLayerId: ''
  },
  uploadShadowImgs: []
}

const mutations: MutationTree<IShadowState> = {
  [SET_UPLOAD_ID](state, id: ILayerIdentifier) {
    Object.assign(state.uploadId, id)
  },
  [SET_PROCESS_ID](state, id: ILayerIdentifier) {
    Object.assign(state.processId, id)
  },
  [ADD_UPLOAD_IMG](state, data: IUploadShadowImg) {
    state.uploadShadowImgs.push(data)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
