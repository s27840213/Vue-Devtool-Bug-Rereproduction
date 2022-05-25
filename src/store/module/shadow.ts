import { SrcObj } from '@/interfaces/gallery'
import { IImageStyle, ILayerIdentifier } from '@/interfaces/layer'
import { GetterTree, MutationTree, ActionTree } from 'vuex'
import { IEditorState, ILayerInfo } from '../types'

const SET_UPLOAD_ID = 'SET_UPLOAD_ID' as const
const SET_PROCESS_ID = 'SET_PROCESS_ID' as const
const SET_HANDLE_ID = 'SET_HANDLE_ID' as const
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
  /**
   * handling means the whole image-shadow applied process,
   * start from open the panel-photo-shadow to the end as finishing uploading
   */
  handleId: ILayerIdentifier,
  uploadShadowImgs: Array<IUploadShadowImg>
}

const getters: GetterTree<IShadowState, IEditorState> = {
  isUploading(state): boolean {
    return state.uploadId.pageId !== '' && state.uploadId.layerId !== ''
  },
  isProcessing(state): boolean {
    return state.processId.pageId !== '' && state.processId.layerId !== ''
  },
  isHandling(state): boolean {
    return state.handleId.pageId !== '' && state.handleId.layerId !== ''
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
  handleId: {
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
  [SET_HANDLE_ID](state, id: ILayerIdentifier) {
    Object.assign(state.handleId, id)
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
