import { ICalculatedGroupStyle } from '@/interfaces/group'
import { IFrame, IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import frameUtils from '@/utils/frameUtils'
import generalUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import { GetterTree, MutationTree } from 'vuex'
import { IEditorState, ILayerInfo, LayerType } from '../types'

const SET_CONFIG = 'SET_CONFIG' as const
const SET_BG_CONFIG = 'SET_BG_CONFIG' as const
const UPDATE_CONFIG = 'UPDATE_CONFIG' as const
const SET_IsBgCtrlImgLoaded = 'SET_IsBgCtrlImgLoaded' as const

export interface IImgControlState {
  image: IImage | undefined,
  image_ori: IImage | undefined,
  primaryLayer?: IFrame | IGroup | IImage,
  layerInfo: ILayerInfo,
  isBgCtrlImgLoaded: boolean
}

const state: IImgControlState = {
  image: undefined,
  image_ori: undefined,
  primaryLayer: undefined,
  layerInfo: {
    pageIndex: -1,
    layerIndex: -1,
    subLayerIdx: -1
  },
  isBgCtrlImgLoaded: false
}

const getters: GetterTree<IImgControlState, IEditorState> = {
  imgControlPageIdx(state): number {
    return state.layerInfo.pageIndex
  },
  isImgCtrl(state): boolean {
    return state.image !== undefined && state.layerInfo.layerIndex !== -1
  },
  isBgImgCtrl(state): boolean {
    return state.image !== undefined && state.layerInfo.layerIndex === -1
  },
  isBgCtrlImgLoaded(state): boolean {
    return state.isBgCtrlImgLoaded
  }
}

const mutations: MutationTree<IImgControlState> = {
  [SET_CONFIG](state, layerInfo?: ILayerInfo | 'reset') {
    if (layerInfo === 'reset') {
      state.image = undefined
      state.image_ori = undefined
      state.layerInfo = { pageIndex: -1, layerIndex: -1, subLayerIdx: -1 }
      return
    }

    const { pageIndex = -1, layerIndex = -1, subLayerIdx = -1 } = layerInfo || {}
    if (pageIndex !== -1 && layerIndex !== -1) {
      state.primaryLayer = (layerUtils.getLayer(pageIndex, layerIndex) || undefined) as IFrame | IGroup | IImage | undefined
      if (!state.primaryLayer || !([LayerType.frame, LayerType.group, LayerType.image] as string[]).includes(state.primaryLayer.type)) {
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

      state.image = layerMapping(state.primaryLayer, generalUtils.deepCopy(layer) as IImage) as IImage
      state.image_ori = generalUtils.deepCopy(state.image)
      state.layerInfo = { pageIndex, layerIndex, subLayerIdx }
    } else {
      /**
       * pageIndex === -1 while the imgControl is set to false
       */
      if (state.image && checkHasActualUpdate()) {
        handleImgLayerUpdate(state.layerInfo, state.image, state.primaryLayer)
        stepsUtils.record()
      }
      state.image = undefined
      state.image_ori = undefined
      state.layerInfo = { pageIndex: -1, layerIndex: -1, subLayerIdx: -1 }
    }
  },
  [SET_BG_CONFIG](state, pageIndex?: number | 'reset') {
    if (pageIndex === 'reset') {
      state.image = undefined
      state.image_ori = undefined
      state.layerInfo = { pageIndex: -1, layerIndex: -1, subLayerIdx: -1 }
      return
    }
    /**
     * pageIndex equals to undefined while the imgControl flag is set to false
     */
    if (pageIndex === undefined) {
      if (state.image && checkHasActualUpdate()) {
        handleBgImgUpdate(state)
        stepsUtils.record()
      }
      state.image = undefined
      state.image_ori = undefined
      state.layerInfo = { pageIndex: -1, layerIndex: -1, subLayerIdx: -1 }
      state.isBgCtrlImgLoaded = false
      return
    }

    state.image = generalUtils.deepCopy(pageUtils.getPage(pageIndex).backgroundImage.config)
    state.image.styles.imgX = pageUtils.getPage(pageIndex).backgroundImage.posX
    state.image.styles.imgY = pageUtils.getPage(pageIndex).backgroundImage.posY
    state.image_ori = generalUtils.deepCopy(state.image)
    state.layerInfo = { pageIndex, layerIndex: -1, subLayerIdx: -1 }
  },
  [UPDATE_CONFIG](state, styles: Partial<IImageStyle>) {
    const { image } = state
    if (image) {
      Object.entries(styles)
        .forEach(([k, v]) => {
          image.styles[k] = v
        })
    }
  },
  [SET_IsBgCtrlImgLoaded](state, bool: boolean) {
    state.isBgCtrlImgLoaded = bool
  }
}

const handleBgImgUpdate = function (state: IImgControlState) {
  const { image } = state
  const pageIndex = state.layerInfo.pageIndex
  if (image) {
    const { imgX, imgY, imgWidth, imgHeight } = image.styles
    pageUtils.updateBackgroundImagePos(pageIndex, imgX, imgY)
    pageUtils.updateBackgroundImageStyles(pageIndex, { imgWidth, imgHeight })
  }
}

const layerMapping = function (primaryLayer: IGroup | IFrame | IImage, image: IImage): IImage {
  image.styles.adjust.blur = 0
  switch (primaryLayer.type) {
    case LayerType.frame: {
      if (frameUtils.isImageFrame(primaryLayer)) {
        image.styles.x = primaryLayer.styles.x
        image.styles.y = primaryLayer.styles.y
        image.styles.scale = primaryLayer.styles.scale
        const pv = primaryLayer.styles.verticalFlip
        const ph = primaryLayer.styles.horizontalFlip
        const v = image.styles.verticalFlip
        const h = image.styles.horizontalFlip
        image.styles.verticalFlip = (pv || v) && !(pv && v)
        image.styles.horizontalFlip = (ph || h) && !(ph && h)
        image.styles.rotate = primaryLayer.styles.rotate
        if (pv) {
          image.styles.imgY = image.styles.height - image.styles.imgHeight - image.styles.imgY
        }
        if (ph) {
          image.styles.imgX = image.styles.width - image.styles.imgWidth - image.styles.imgX
        }
        return image
      } else {
        image.styles.x *= primaryLayer.styles.scale
        image.styles.y *= primaryLayer.styles.scale
        if (primaryLayer.styles.horizontalFlip || primaryLayer.styles.verticalFlip) {
          const { imgX, imgY, imgWidth, imgHeight, width, height } = image.styles
          const [baselineX, baselineY] = [-(imgWidth - width) / 2, -(imgHeight - height) / 2]
          const [translateX, translateY] = [imgX - baselineX, imgY - baselineY]
          image.styles.imgX -= primaryLayer.styles.horizontalFlip ? translateX * 2 : 0
          image.styles.imgY -= primaryLayer.styles.verticalFlip ? translateY * 2 : 0
        }
        const mappedImage = groupUtils.mapLayersToPage([image], primaryLayer)[0] as IImage
        return mappedImage
      }
    }
    case LayerType.group: {
      const scale = image.styles.scale
      image.styles.scale = 1
      image.styles.x *= primaryLayer.styles.scale
      image.styles.y *= primaryLayer.styles.scale
      const mappedLayer = groupUtils
        .mapLayersToPage([image], primaryLayer)[0] as IImage
      mappedLayer.styles.scale = scale
      return mappedLayer
    }
    case LayerType.image: {
      return image
    }
  }
  return image
}

const checkHasActualUpdate = function (): boolean {
  const { image, image_ori } = state
  if (image && image_ori) {
    return image.styles.imgX !== image_ori.styles.imgX ||
      image.styles.imgY !== image_ori.styles.imgY ||
      image.styles.imgWidth !== image_ori.styles.imgWidth ||
      image.styles.imgHeight !== image_ori.styles.imgHeight
  }
  return false
}

const handleImgLayerUpdate = function (layerInfo: ILayerInfo, image: IImage, _primaryLayer?: IGroup | IFrame | IImage) {
  const { layerIndex, pageIndex, subLayerIdx } = layerInfo
  const primaryLayer = _primaryLayer ?? layerUtils.getLayer(pageIndex, layerIndex)
  switch (primaryLayer.type) {
    case LayerType.frame: {
      if (frameUtils.isImageFrame(primaryLayer as IFrame)) {
        let { styles: { imgX, imgY, imgWidth, imgHeight, width, height } } = image
        if (primaryLayer.styles.verticalFlip) {
          imgY = height - imgHeight - imgY
        }
        if (primaryLayer.styles.horizontalFlip) {
          imgX = width - imgWidth - imgX
        }
        frameUtils.updateFrameLayerStyles(pageIndex, layerIndex, 0, {
          imgX, imgY, imgHeight, imgWidth
        })
        return
      }
      const subLayer = groupUtils.mapLayersToTmp([image], primaryLayer.styles as ICalculatedGroupStyle)[0] as IImage
      let { styles: { imgX, imgY, imgWidth, imgHeight, width, height } } = subLayer
      if (primaryLayer.styles.horizontalFlip) {
        imgX = width - imgWidth - imgX
      }
      if (primaryLayer.styles.verticalFlip) {
        imgY = height - imgHeight - imgY
      }
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
      let { styles: { imgX, imgY, imgWidth, imgHeight } } = subLayer
      imgX /= primaryLayer.styles.scale
      imgY /= primaryLayer.styles.scale
      imgWidth /= primaryLayer.styles.scale
      imgHeight /= primaryLayer.styles.scale
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
