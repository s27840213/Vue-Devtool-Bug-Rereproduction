import { IFrame, IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import { GetterTree, MutationTree } from 'vuex'
import { IEditorState, ILayerInfo, LayerType } from '../types'
import generalUtils from '@/utils/generalUtils'
import layerUtils from '@/utils/layerUtils'
import { functionsIn } from 'lodash'
import groupUtils from '@/utils/groupUtils'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import frameUtils from '@/utils/frameUtils'

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
        handleImgLayerUpdate(state.layerInfo, state.image, state.primaryLayer)
      }
      state.image = undefined
      state.layerInfo = { pageIndex: -1, layerIndex: -1, subLayerIdx: -1 }
      return
    }

    let layer
    if (typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1) {
      if (state.primaryLayer.type === LayerType.group) {
        layer = (state.primaryLayer as IGroup).layers[subLayerIdx]
      } else if (state.primaryLayer.type === LayerType.frame) {
        layer = (state.primaryLayer as IFrame).clips[subLayerIdx]
      }
    } else {
      layer = layerUtils.getLayer(pageIndex, layerIndex) as IImage
    }

    state.image = layerMapping(state.primaryLayer, generalUtils.deepCopy(layer)) as IImage
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

const layerMapping = function (primaryLayer: IGroup | IFrame | IImage, image: IImage): IImage {
  switch (primaryLayer.type) {
    case LayerType.frame: {
      if (frameUtils.isImageFrame(primaryLayer as IFrame)) {
        image.styles.x = primaryLayer.styles.x
        image.styles.y = primaryLayer.styles.y
        image.styles.scale = 1
        // image.styles.imgWidth *= layer.styles.scale
        // image.styles.imgHeight *= layer.styles.scale
        return image
      }
      image.styles.x *= primaryLayer.styles.scale
      image.styles.y *= primaryLayer.styles.scale
      if (primaryLayer.styles.horizontalFlip || primaryLayer.styles.verticalFlip) {
        const { imgX, imgY, imgWidth, imgHeight, width, height } = image.styles
        const [baselineX, baselineY] = [-(imgWidth - width) / 2, -(imgHeight - height) / 2]
        const [translateX, translateY] = [imgX - baselineX, imgY - baselineY]
        image.styles.imgX -= primaryLayer.styles.horizontalFlip ? translateX * 2 : 0
        image.styles.imgY -= primaryLayer.styles.verticalFlip ? translateY * 2 : 0
      }
      return groupUtils.mapLayersToPage([image], primaryLayer as IGroup)[0] as IImage
    }
    case LayerType.group: {
      const scale = image.styles.scale
      image.styles.scale = 1
      image.styles.x *= primaryLayer.styles.scale
      image.styles.y *= primaryLayer.styles.scale
      const mappedLayer = groupUtils
        .mapLayersToPage([image], primaryLayer as IGroup)[0] as IImage
      mappedLayer.styles.scale = scale
      return mappedLayer
    }
    case LayerType.image: {
      return image
    }
  }
  return image
}

const handleImgLayerUpdate = function (layerInfo: ILayerInfo, image: IImage, _primaryLayer?: IGroup | IFrame | IImage) {
  const { layerIndex, pageIndex, subLayerIdx } = layerInfo
  const primaryLayer = _primaryLayer ?? layerUtils.getLayer(pageIndex, layerIndex)
  switch (primaryLayer.type) {
    case LayerType.frame: {
      const subLayer = groupUtils.mapLayersToTmp([image], primaryLayer.styles as ICalculatedGroupStyle)[0] as IImage
      let { styles: { imgX, imgY, imgWidth, imgHeight } } = subLayer
      imgX /= primaryLayer.styles.scale
      imgY /= primaryLayer.styles.scale
      imgWidth /= primaryLayer.styles.scale
      imgHeight /= primaryLayer.styles.scale
      frameUtils.updateFrameLayerStyles(pageIndex, layerIndex, subLayerIdx ?? 0, {
        imgX, imgY, imgHeight: imgHeight, imgWidth
      })
      break
    }
    case LayerType.group: {
      const subLayer = groupUtils.mapLayersToTmp([image], primaryLayer.styles as ICalculatedGroupStyle)[0] as IImage
      const { styles: { imgX, imgY, imgWidth, imgHeight } } = subLayer
      layerUtils.updateLayerStyles(pageIndex, layerIndex, {
        imgX, imgY, imgHeight, imgWidth
      }, subLayerIdx)
      break
    }
    case LayerType.image: {
      const { styles: { imgX, imgY, imgWidth, imgHeight } } = image
      layerUtils.updateLayerStyles(pageIndex, layerIndex, {
        imgX, imgY, imgHeight, imgWidth
      })
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
