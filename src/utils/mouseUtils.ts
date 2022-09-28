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
class MouseUtils {
  private getEventType(e: MouseEvent | TouchEvent | PointerEvent) {
    if (e.type.includes('pointer')) {
      return 'pointer'
    } else if (e.type.includes('mouse')) {
      return 'mouse'
    } else if (e.type.includes('touch')) {
      return 'touch'
    } else {
      // default
      return 'mouse'
    }
  }

  getMouseAbsPoint(e: MouseEvent | TouchEvent | PointerEvent) {
    const type = this.getEventType(e)
    const x = type === 'pointer' ? (e as PointerEvent).clientX : type === 'mouse' ? (e as MouseEvent).clientX : (e as TouchEvent).touches[0].clientX
    const y = type === 'pointer' ? (e as PointerEvent).clientY : type === 'mouse' ? (e as MouseEvent).clientY : (e as TouchEvent).touches[0].clientY
    return {
      x,
      y
    }
  }

  getMouseRelPoint(e: MouseEvent | TouchEvent | PointerEvent, target: HTMLElement | { x: number, y: number }) {
    let x: number
    let y: number
    const type = this.getEventType(e)
    const clientX = type === 'pointer' ? (e as PointerEvent).clientX : type === 'mouse' ? (e as MouseEvent).clientX : (e as TouchEvent).touches[0].clientX
    const clientY = type === 'pointer' ? (e as PointerEvent).clientY : type === 'mouse' ? (e as MouseEvent).clientY : (e as TouchEvent).touches[0].clientY
    if (target instanceof HTMLElement) {
      const rect = target.getBoundingClientRect()
      x = clientX + target.scrollLeft - rect.left
      y = clientY + target.scrollTop - rect.top
    } else {
      x = clientX - target.x
      y = clientY - target.y
    }
    return { x, y }
  }

  getMousePosInPage(e: MouseEvent | TouchEvent | PointerEvent, pageIndex: number): { x: number, y: number } {
    const target = store.getters['bgRemove/getInBgRemoveMode'] ? document.getElementsByClassName('bg-remove-area')[0] as HTMLElement : document.getElementsByClassName(`nu-page-${pageIndex}`)[0] as HTMLElement
    const mouseRelPos = this.getMouseRelPoint(e, target)
    return {
      x: mouseRelPos.x / (store.getters.getPageScaleRatio / 100),
      y: mouseRelPos.y / (store.getters.getPageScaleRatio / 100)
    }
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
        // LayerUtils.updateLayerProps(pageIndex, layerIndex, {
        //   srcObj: { ...layer.srcObj }
        // })
        // const { imgX, imgY, imgWidth, imgHeight } = layer.styles
        // LayerUtils.updateLayerStyles(pageIndex, layerIndex, {
        //   imgX, imgY, imgWidth, imgHeight
        // })
        // StepsUtils.record()~
      }
    }
  }

  onDrop(e: DragEvent, pageIndex: number, targetOffset: ICoordinate = { x: 0, y: 0 }) {
    const layer = this.onDropHandler(e, pageIndex, targetOffset)
    if (layer) {
      groupUtils.deselect()
      const index = LayerUtils.getObjectInsertionLayerIndex(store.getters.getPage(pageIndex).layers, layer) + 1
      LayerUtils.addLayersToPos(pageIndex, [layer], index)
      zindexUtils.reassignZindex(pageIndex)
      groupUtils.select(pageIndex, [index])
      StepsUtils.record()
    }
  }

  onDropHandler(e: DragEvent, pageIndex: number, targetOffset: ICoordinate = { x: 0, y: 0 }): IShape | IText | IImage | ITmp | undefined {
    const dropData = e.dataTransfer ? e.dataTransfer.getData('data') : null
    if (dropData === null || typeof dropData !== 'string') return
    const data = JSON.parse(dropData)
    // const target = e.target as HTMLElement
    const target = document.querySelector(`.nu-page-${pageIndex}`) as HTMLElement
    const targetPos = {
      x: target.getBoundingClientRect().x,
      y: target.getBoundingClientRect().y
    }
    const x = (e.clientX - targetPos.x + targetOffset.x) * (100 / store.state.pageScaleRatio)
    const y = (e.clientY - targetPos.y + targetOffset.y) * (100 / store.state.pageScaleRatio)

    const layerConfig: ILayer = {
      type: data.type,
      pageIndex: pageIndex,
      active: false,
      shown: false,
      locked: false,
      moved: false,
      dragging: false,
      designId: data.designId || '',
      styles: {
        x: x,
        y: y,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        width: data.styles.width,
        height: data.styles.height,
        initWidth: data.styles.initWidth || data.styles.width,
        initHeight: data.styles.initHeight || data.styles.height,
        zindex: -1,
        opacity: 100,
        horizontalFlip: data.styles.horizontalFlip || false,
        verticalFlip: data.styles.verticalFlip || false
      }
    }

    switch (data.type) {
      case 'image': {
        if (store.getters.getCurrSidebarPanelType === SidebarPanelType.bg) {
          this.backgroundHandler(pageIndex, layerConfig)
          break
        } else {
          Object.assign(layerConfig, { srcObj: data.srcObj })
          return LayerFactary.newImage(layerConfig)
        }
      }
      case 'shape': {
        console.log(data.category)
        Object.assign(layerConfig, { category: data.category })
        return LayerFactary.newShape(layerConfig)
      }
      default: {
        AssetUtils.addAsset(data, { pageIndex, styles: { x, y } })
      }
    }
  }

  backgroundHandler(pageIndex: number, config: ILayer) {
    store.commit('SET_backgroundImage', {
      pageIndex: pageIndex,
      config: config
    })
  }

  clipperHandler(_layer: IImage, clipPath: string, clipperStyles: IStyle): IImage {
    /**
     * If the clipper is already clipped an image, setting the initial size as the layer size.
     */
    const layer = generalUtils.deepCopy(_layer) as IImage
    if (typeof clipperStyles.imgX !== 'undefined') {
      clipperStyles.initWidth = clipperStyles.width / clipperStyles.scale
      clipperStyles.initHeight = clipperStyles.height / clipperStyles.scale
    }
    const img = {
      width: layer.styles.width,
      height: layer.styles.height
    }
    /**
     * Below determines the img's initial width/height
     */
    const scaleImg = (scaleRatio: number) => {
      img.width *= scaleRatio
      img.height *= scaleRatio
    }
    while (img.width < clipperStyles.width || img.height < clipperStyles.height) {
      img.height < clipperStyles.height
        ? scaleImg(clipperStyles.height / img.height) : scaleImg(clipperStyles.width / img.width)
    }

    if (img.width > clipperStyles.width && img.height > clipperStyles.height) {
      clipperStyles.width / img.width < clipperStyles.height / img.height
        ? scaleImg(clipperStyles.height / img.height) : scaleImg(clipperStyles.width / img.width)
    }

    const newStyles = {
      width: clipperStyles.width,
      height: clipperStyles.height,
      initWidth: img.width,
      initHeight: img.height,
      imgWidth: img.width,
      imgHeight: img.height,
      scale: clipperStyles.scale,
      imgX: -img.width / 2 + clipperStyles.width / 2,
      imgY: -img.height / 2 + clipperStyles.height / 2
    }
    Object.assign(layer.styles, newStyles)
    layer.clipPath = clipPath.substring(0, 4) === 'path' ? clipPath : `path('${clipPath}')`
    return layer
  }
}

const mouseUtils = new MouseUtils()
export default mouseUtils
