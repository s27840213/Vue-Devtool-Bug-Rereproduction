import { IFrame, IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import { GetterTree, MutationTree } from 'vuex'
import { IEditorState, ILayerInfo, LayerType } from '../types'
import generalUtils from '@/utils/generalUtils'
import layerUtils from '@/utils/layerUtils'
import { functionsIn } from 'lodash'
import groupUtils from '@/utils/groupUtils'

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

// getCurrSubSelectedLayerShown(): IImage | undefined {
//   const layer = this.getCurrLayer
//   if (layer.type === 'group') {
//     const subLayer = generalUtils.deepCopy((this.getCurrLayer as IGroup).layers[this.currSubSelectedInfo.index]) as IImage
//     const scale = subLayer.styles.scale
//     subLayer.styles.scale = 1
//     subLayer.styles.x *= layer.styles.scale
//     subLayer.styles.y *= layer.styles.scale
//     const mappedLayer = GroupUtils
//       .mapLayersToPage([subLayer], this.getCurrLayer as ITmp)[0] as IImage
//     mappedLayer.styles.scale = scale
//     return Object.assign(mappedLayer, { forRender: true, pointerEvents: 'none' })
//   } else if (layer.type === 'frame') {
//     if (frameUtils.isImageFrame(layer as IFrame)) {
//       const image = generalUtils.deepCopy((layer as IFrame).clips[0]) as IImage
//       image.styles.x = layer.styles.x
//       image.styles.y = layer.styles.y
//       image.styles.scale = 1
//       // image.styles.imgWidth *= layer.styles.scale
//       // image.styles.imgHeight *= layer.styles.scale
//       return Object.assign(image, { forRender: true })
//     }
//     const primaryLayer = this.getCurrLayer as IFrame
//     const image = generalUtils.deepCopy(primaryLayer.clips[Math.max(this.currSubSelectedInfo.index, 0)]) as IImage
//     image.styles.x *= primaryLayer.styles.scale
//     image.styles.y *= primaryLayer.styles.scale
//     if (primaryLayer.styles.horizontalFlip || primaryLayer.styles.verticalFlip) {
//       const { imgX, imgY, imgWidth, imgHeight, width, height } = image.styles
//       const [baselineX, baselineY] = [-(imgWidth - width) / 2, -(imgHeight - height) / 2]
//       const [translateX, translateY] = [imgX - baselineX, imgY - baselineY]
//       image.styles.imgX -= primaryLayer.styles.horizontalFlip ? translateX * 2 : 0
//       image.styles.imgY -= primaryLayer.styles.verticalFlip ? translateY * 2 : 0
//     }
//     Object.assign(image, { forRender: true })
//     return GroupUtils.mapLayersToPage([image], this.getCurrLayer as ITmp)[0] as IImage
//   }
//   return undefined
// },

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
        handleImgLayerUpdate(state.layerInfo, state.image)
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
    case LayerType.frame:
      return image
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

const handleImgLayerUpdate = function (layerInfo: ILayerInfo, image: IImage) {
  const { layerIndex, pageIndex, subLayerIdx } = layerInfo
  const primaryLayer = layerUtils.getLayer(pageIndex, layerIndex)
  switch (primaryLayer.type) {
    case LayerType.frame:
    case LayerType.group:
      // const subLayer = generalUtils.deepCopy((this.getCurrLayer as IGroup).layers[this.currSubSelectedInfo.index]) as IImage
      // const scale = subLayer.styles.scale
      // subLayer.styles.scale = 1
      // subLayer.styles.x *= layer.styles.scale
      // subLayer.styles.y *= layer.styles.scale
      // const mappedLayer = GroupUtils
      //   .mapLayersToPage([subLayer], this.getCurrLayer as ITmp)[0] as IImage
      // mappedLayer.styles.scale = scale
      // return Object.assign(mappedLayer, { forRender: true, pointerEvents: 'none' })
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
