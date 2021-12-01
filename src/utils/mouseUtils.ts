/**
 */
import store from '@/store'
import { IFrame, IImage, ILayer, IShape, IStyle, IText, ITmp } from '@/interfaces/layer'
import { SidebarPanelType } from '@/store/types'
import LayerFactary from '@/utils/layerFactary'
import { ICoordinate } from '@/interfaces/frame'
import LayerUtils from '@/utils/layerUtils'
import StepsUtils from '@/utils/stepsUtils'
import groupUtils from './groupUtils'
import zindexUtils from './zindexUtils'
import AssetUtils from './assetUtils'
import generalUtils from './generalUtils'
import FrameUtils from './frameUtils'
import { drop } from 'lodash'
import { Layer } from 'konva/types/Layer'
import page from '@/store/module/page'

class MouseUtils {
  getMouseAbsPoint(e: MouseEvent) {
    return { x: e.clientX, y: e.clientY }
  }

  getMouseRelPoint(e: MouseEvent, target: HTMLElement | { x: number, y: number }) {
    let x: number
    let y: number
    if (target instanceof HTMLElement) {
      const rect = target.getBoundingClientRect()
      x = e.clientX + target.scrollLeft - rect.left
      y = e.clientY + target.scrollTop - rect.top
    } else {
      x = e.clientX - target.x
      y = e.clientY - target.y
    }
    return { x, y }
  }

  onDropClipper(e: DragEvent, pageIndex: number, layerIndex: number, targetOffset: ICoordinate = { x: 0, y: 0 },
    clipPath: string | undefined, clipperStyles: IStyle) {
    if (typeof clipPath === 'undefined') {
      clipPath = `path('M0 0 L0 ${clipperStyles.height} ${clipperStyles.width} ${clipperStyles.height} ${clipperStyles.width} 0Z')`
    }
    let layer = this.onDropHandler(e, pageIndex, targetOffset) as IImage
    if (layer && clipperStyles && layer.type === 'image') {
      layer = this.clipperHandler(layer, clipPath, clipperStyles)
      if (layer) {
        groupUtils.deselect()
        LayerUtils.deleteLayer(layerIndex)
        LayerUtils.addLayersToPos(pageIndex, [layer], layerIndex)
        zindexUtils.reassignZindex(pageIndex)
        groupUtils.select(pageIndex, [layerIndex])
        StepsUtils.record()
      }
    }
  }

  // onDropFrame(e: DragEvent, pageIndex: number, layerIndex: number, clipIdx: number) {
  //   const dropData = e.dataTransfer ? e.dataTransfer.getData('data') : null
  //   if (dropData === null || typeof dropData !== 'string') {
  //     throw new Error('Drop item is null!')
  //   }
  //   console.log(dropData)

  //   const data = JSON.parse(dropData)
  //   const frame = LayerUtils.getLayer(pageIndex, layerIndex) as IFrame
  //   const clips = generalUtils.deepCopy(frame.clips)
  //   clips[clipIdx].srcObj = {
  //     ...data.srcObj
  //   }
  //   LayerUtils.updateLayerProps(pageIndex, layerIndex, { clips })

  //   const clip = clips[clipIdx]
  //   console.log(data)
  //   const {
  //     imgWidth, imgHeight,
  //     imgX, imgY
  //   } = this.clipperHandler(data, clip.clipPath, clip.styles).styles
  //   FrameUtils.updateFrameLayerStyles(pageIndex, layerIndex, clipIdx, {
  //     imgX,
  //     imgY,
  //     imgWidth,
  //     imgHeight
  //   })
  // }

  onDrop(e: DragEvent, pageIndex: number, targetOffset: ICoordinate = { x: 0, y: 0 }) {
    const layer = this.onDropHandler(e, pageIndex, targetOffset)
    if (layer) {
      const index = LayerUtils.getUpmostNonTextLayerIndex(store.getters.getPage(pageIndex).layers) + 1
      LayerUtils.addLayersToPos(pageIndex, [layer], index)
      zindexUtils.reassignZindex(pageIndex)
      StepsUtils.record()
      // if (layer.type === 'text') {
      //   TextUtils.updateTextPropsState()
      // }
      // StepsUtils.record()
    }
  }

  onDropHandler(e: DragEvent, pageIndex: number, targetOffset: ICoordinate = { x: 0, y: 0 }): IShape | IText | IImage | ITmp | undefined {
    const dropData = e.dataTransfer ? e.dataTransfer.getData('data') : null
    if (dropData === null || typeof dropData !== 'string') return
    const data = JSON.parse(dropData)
    const target = e.target as HTMLElement
    const targetPos = {
      x: target.getBoundingClientRect().x,
      y: target.getBoundingClientRect().y
    }
    const x = (e.clientX - targetPos.x + targetOffset.x) * (100 / store.state.pageScaleRatio)
    const y = (e.clientY - targetPos.y + targetOffset.y) * (100 / store.state.pageScaleRatio)

    const pageSize = store.getters.getPageSize(pageIndex)
    const resizeRatio = 0.8
    const pageAspectRatio = pageSize.width / pageSize.height
    const photoAspectRatio = data.styles.width / data.styles.height
    const photoWidth = photoAspectRatio > pageAspectRatio ? pageSize.width * resizeRatio : (pageSize.height * resizeRatio) * photoAspectRatio
    const photoHeight = photoAspectRatio > pageAspectRatio ? (pageSize.width * resizeRatio) / photoAspectRatio : pageSize.height * resizeRatio

    let layer
    switch (data.type) {
      case 'image': {
        const layerConfig: ILayer = {
          type: data.type,
          pageIndex: pageIndex,
          active: false,
          shown: false,
          locked: false,
          moved: false,
          dragging: false,
          designId: '',
          styles: {
            x: x,
            y: y,
            scale: 1,
            scaleX: 1,
            scaleY: 1,
            rotate: 0,
            width: photoWidth,
            height: photoHeight,
            initWidth: photoWidth,
            initHeight: photoHeight,
            zindex: -1,
            opacity: 100,
            horizontalFlip: data.styles.horizontalFlip,
            verticalFlip: data.styles.verticalFlip
          }
        }
        const imgStyles = {
          imgX: 0,
          imgY: 0,
          imgWidth: layerConfig.styles.initWidth,
          imgHeight: layerConfig.styles.initHeight
        }
        Object.assign(layerConfig.styles, imgStyles)
        Object.assign(layerConfig, { srcObj: data.srcObj, imgControl: false })
        if (store.getters.getCurrSidebarPanelType === SidebarPanelType.bg) {
          this.backgroundHandler(pageIndex, layerConfig)
          return
        } else {
          layer = LayerFactary.newImage(layerConfig as IImage)
        }
        break
      }
      default: {
        AssetUtils.addAsset(data, { pageIndex, styles: { x, y } })
        return
      }
    }
    return layer
  }

  backgroundHandler(pageIndex: number, config: ILayer) {
    store.commit('SET_backgroundImage', {
      pageIndex: pageIndex,
      config: config
    })
  }

  clipperHandler(l: IImage, clipPath: string, clipperStyles: IStyle): IImage {
    /**
     * If the clipper is already clipped an image, setting the initial size as the layer size.
     */
    const layer = generalUtils.deepCopy(l) as IImage
    if (typeof clipperStyles.imgX !== 'undefined') {
      clipperStyles.initWidth = clipperStyles.width / clipperStyles.scale
      clipperStyles.initHeight = clipperStyles.height / clipperStyles.scale
    }
    const img = {
      width: layer.styles.width,
      height: layer.styles.height
    }
    const ratio = {
      width: clipperStyles.initWidth / img.width,
      height: clipperStyles.initHeight / img.height
    }

    /**
     * Below determines the img's initial width/height
     */
    let scaleRatio: number
    const scaleImg = (scaleRatio: number) => {
      img.width *= scaleRatio
      img.height *= scaleRatio
    }
    if (img.width > img.height) {
      scaleRatio = ratio.height
      scaleImg(scaleRatio)
    } else {
      scaleRatio = ratio.width
      scaleImg(scaleRatio)
    }
    if (img.width < clipperStyles.initWidth || img.height < clipperStyles.initHeight) {
      const scaleRatio = img.height < clipperStyles.initHeight ? clipperStyles.initHeight / img.height
        : clipperStyles.initWidth / img.width
      scaleImg(scaleRatio)
    }

    const newStyles = {
      width: clipperStyles.width,
      height: clipperStyles.height,
      initWidth: img.width,
      initHeight: img.height,
      imgWidth: img.width,
      imgHeight: img.height,
      scale: clipperStyles.scale,
      rotate: clipperStyles.rotate,
      imgX: -img.width / 2 + clipperStyles.initWidth / 2,
      imgY: -img.height / 2 + clipperStyles.initHeight / 2,
      x: clipperStyles.x,
      y: clipperStyles.y
    }
    Object.assign(layer.styles, newStyles)
    layer.clipPath = clipPath.substring(0, 4) === 'path' ? clipPath : `path('${clipPath}')`
    return layer
  }
}

const mouseUtils = new MouseUtils()
export default mouseUtils
