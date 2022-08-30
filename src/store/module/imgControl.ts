import { IFrame, IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import { GetterTree, MutationTree } from 'vuex'
import { IEditorState, ILayerInfo, LayerType } from '../types'
import generalUtils from '@/utils/generalUtils'
import layerUtils from '@/utils/layerUtils'

const SET_CONFIG = 'SET_CONFIG' as const
const UPDATE_CONFIG = 'UPDATE_CONFIG' as const

interface IImgControlState {
  image?: IImage,
  primaryLayer?: IFrame | IGroup | IImage,
  layerInfo: ILayerInfo
}

const state: IImgControlState = {
  image: undefined,
  primaryLayer: undefined,
  layerInfo: {
    pageIndex: -1,
    layerIndex: -1,
    subLayerIdx: -1
  }
}

const getters: GetterTree<IImgControlState, IEditorState> = {
  isImgControl(state): boolean {
    return state.image !== undefined
  }
}

const mutations: MutationTree<IImgControlState> = {
  [SET_CONFIG] (state, layerInfo?: ILayerInfo) {
    const { pageIndex = -1, layerIndex = -1, subLayerIdx = -1 } = layerInfo || {}
    if (pageIndex !== -1 && layerIndex !== -1) {
      state.primaryLayer = (layerUtils.getLayer(pageIndex, layerIndex) || undefined) as IFrame | IGroup | IImage | undefined
      if (!state.primaryLayer || !([LayerType.frame, LayerType.group, LayerType.image] as string[]).includes(state.primaryLayer.type)) {
        state.image = undefined
        state.layerInfo = { pageIndex: -1, layerIndex: -1, subLayerIdx: -1 }
        return
      }
    } else {
      if (state.image) {
        handleImgMapping(state.layerInfo, state.image)
      }
      state.image = undefined
      state.layerInfo = { pageIndex: -1, layerIndex: -1, subLayerIdx: -1 }
      return
    }

    let layer
    if (typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1) {
      if (state.primaryLayer.type === LayerType.group) {
        layer = (state.primaryLayer as IGroup).layers[subLayerIdx]
      } else if (state.primaryLayer.type === LayerType.group) {
        layer = (state.primaryLayer as IFrame).clips[subLayerIdx]
      }
    } else {
      layer = layerUtils.getLayer(pageIndex, layerIndex) as IImage
    }

    state.image = generalUtils.deepCopy(layer) as IImage
    state.image.imgControl = false
    state.layerInfo = { pageIndex, layerIndex, subLayerIdx }
  },
  [UPDATE_CONFIG] (state, styles: Partial<IImageStyle>) {
    const { image } = state
    if (image) {
      Object.entries(styles)
        .forEach(([k, v]) => {
          image.styles[k] = v
        })
    }
  }
}

const handleImgMapping = function (layerInfo: ILayerInfo, image: IImage) {
  const { layerIndex, pageIndex, subLayerIdx } = layerInfo
  const primaryLayer = layerUtils.getLayer(pageIndex, layerIndex)
  switch (primaryLayer.type) {
    case LayerType.frame:
    case LayerType.group:
      break
    case LayerType.image: {
      const { styles: { imgX, imgY, imgWidth, imgHeight } } = image
      layerUtils.updateLayerStyles(pageIndex, layerIndex, {
        imgX, imgY, imgHeight, imgWidth
      }, subLayerIdx)
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
