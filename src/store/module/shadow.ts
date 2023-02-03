import user from '@/apis/user'
import { SrcObj } from '@/interfaces/gallery'
import { IImageStyle, ILayerIdentifier } from '@/interfaces/layer'
import { GetterTree, MutationTree, ActionTree } from 'vuex'
import { IEditorState } from '../types'
import authToken from '@/apis/auth-token'
import apiUtils from '@/utils/apiUtils'
import store from '..'

const SET_UPLOAD_ID = 'SET_UPLOAD_ID' as const
const SET_PROCESS_ID = 'SET_PROCESS_ID' as const
const SET_HANDLE_ID = 'SET_HANDLE_ID' as const
const ADD_UPLOAD_IMG = 'ADD_UPLOAD_IMG' as const
const ADD_SHADOW_IMG = 'ADD_SHADOW_IMG' as const

export interface IUploadShadowImg {
  id: string,
  owner: ILayerIdentifier,
  srcObj: SrcObj,
  styles: Partial<IImageStyle>
}

export interface IShadowAsset {
  urls: {
    prev: string,
    full: string,
    larg: string,
    original: string,
    midd: string,
    smal: string,
    tiny: string
  }
}
interface IShadowState {
  uploadId: ILayerIdentifier,
  processId: ILayerIdentifier,
  /**
   * handling means the whole image-shadow applied process,
   * start from open the panel-photo-shadow to the end as finishing uploading
   */
  handleId: ILayerIdentifier,
  uploadShadowImgs: Array<IUploadShadowImg>,
  shadowImgs: Map<number, IShadowAsset>
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
  },
  shadowImgs(state): Map<number, IShadowAsset> {
    return state.shadowImgs
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
  uploadShadowImgs: [],
  shadowImgs: new Map()
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

const actions: ActionTree<IShadowState, unknown> = {
  async [ADD_SHADOW_IMG]({ state }, assetIndices: Array<number>) {
    await apiUtils.requestWithRetry(() => {
      return user.getAllAssets(store.getters['user/getToken'] || authToken().token || '', {
        asset_list: assetIndices.join(',')
      })
    }).then((data) => {
      state.shadowImgs.set(assetIndices[0], { urls: data.data.url_map[assetIndices[0]] })
    }).catch((e) => {
      console.error(e)
    })

    // state.shadowImgs.push()
  }
}

export default {
  namespaced: true,
  state,
  actions,
  getters,
  mutations
}
