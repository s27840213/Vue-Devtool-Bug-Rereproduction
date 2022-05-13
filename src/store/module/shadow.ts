import { LayerIdentifier } from '@/interfaces/layer'
import { GetterTree, MutationTree, ActionTree } from 'vuex'
import { IEditorState } from '../types'

const SET_UPLOAD_ID = 'SET_UPLOAD_ID' as const
const SET_PROCESS_ID = 'SET_PROCESS_ID' as const

interface IShadowState {
  uploadId: LayerIdentifier
  processId: LayerIdentifier
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
  }
}

const mutations: MutationTree<IShadowState> = {
  [SET_UPLOAD_ID](state, id: LayerIdentifier) {
    Object.assign(state.uploadId, id)
  },
  [SET_PROCESS_ID](state, id: LayerIdentifier) {
    Object.assign(state.processId, id)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
