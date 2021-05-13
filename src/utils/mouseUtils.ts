/**
 */
import store from '@/store'
import { ILayer, IStyle } from '@/interfaces/layer'
import GroupUtils from '@/utils/groupUtils'
import { PanelType } from '@/store/types'
import LayerFactary from '@/utils/layerFactary'
import { ICoordinate } from '@/interfaces/frame'
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

  onDropClipper(e: DragEvent, pageIndex: number, layerIndex: number, targetOffset: ICoordinate = { x: 0, y: 0},
    clipPath = '', clipperStyles: IStyle | null = null) {
    let layer = this.onDropHandler(e, pageIndex, targetOffset)

    if (layer && clipperStyles && layer.type === 'image') {
      layer = this.clipperHandler(layer, clipPath, clipperStyles)
      this.refreshLayers(pageIndex, layer)
    }
  }

  onDrop(e: DragEvent, pageIndex: number, targetOffset: ICoordinate = { x: 0, y: 0}) {
    const layer = this.onDropHandler(e, pageIndex, targetOffset)
    if (layer) {
      this.refreshLayers(pageIndex, layer)
    }
  }

  onDropHandler(e: DragEvent, pageIndex: number, targetOffset: ICoordinate = { x: 0, y: 0 }): ILayer | undefined {
    if (e.dataTransfer === null) return

    const data = JSON.parse(e.dataTransfer.getData('data'))
    const target = e.target as HTMLElement
    const targetPos = {
      x: target.getBoundingClientRect().x,
      y: target.getBoundingClientRect().y
    }
    if (store.getters.getCurrPanelType === PanelType.bg) {
      this.backgroundHandler(pageIndex, data.src)
      return
    }

    const x = (e.clientX - targetPos.x + targetOffset.x - data.styles.x) * (100 / store.state.pageScaleRatio)
    const y = (e.clientY - targetPos.y + targetOffset.y - data.styles.y) * (100 / store.state.pageScaleRatio)
    const layerConfig: ILayer = {
      type: data.type,
      pageIndex: pageIndex,
      active: false,
      shown: false,
      styles: {
        x: x,
        y: y,
        initX: x,
        initY: y,
        scale: 1,
        scaleX: 0,
        scaleY: 0,
        rotate: 0,
        width: data.styles.width,
        height: data.styles.height,
        initWidth: data.styles.initWidth ? data.styles.initWidth : data.styles.width,
        initHeight: data.styles.initHeight ? data.styles.initHeight : data.styles.height
      }
    }

    let layer
    if (data.type === 'image') {
      layer = LayerFactary.newImage(pageIndex, Object.assign(layerConfig, { src: data.src }))
    } else if (data.type === 'text') {
      const tmpPos = { x: layerConfig.styles.x, y: layerConfig.styles.y }
      Object.assign(layerConfig.styles, data.styles)
      layerConfig.styles.x = tmpPos.x
      layerConfig.styles.y = tmpPos.y
      layer = LayerFactary.newText(pageIndex, Object.assign(layerConfig, { text: data.text }))
    } else if (data.type === 'shape') {
      const shapeConfig = {
        viewBox: data.viewBox,
        path: data.path,
        category: data.category,
        clipper: data.clipper
      }
      const tmpPos = { x: layerConfig.styles.x, y: layerConfig.styles.y }
      Object.assign(layerConfig.styles, data.styles)
      layerConfig.styles.x = tmpPos.x
      layerConfig.styles.y = tmpPos.y
      layer = LayerFactary.newShape(pageIndex, Object.assign(layerConfig, shapeConfig))
    }
    return layer
  }

  refreshLayers(pageIndex: number, layer: ILayer) {
    store.commit('ADD_newLayers', {
      pageIndex: pageIndex,
      layers: [layer]
    })
    GroupUtils.deselect()
    store.commit('SET_lastSelectedPageIndex', pageIndex)
    GroupUtils.select([store.getters.getLayers(pageIndex).length - 1])
  }

  backgroundHandler(pageIndex: number, src: string) {
    store.commit('SET_backgroundImageSrc', {
      pageIndex: pageIndex,
      imageSrc: src
    })
  }

  clipperHandler(layer: ILayer, clipPath: string, clipperStyles: IStyle): ILayer {
    const imgHW = {
      width: layer.styles.width,
      height: layer.styles.height
    }
    const ratio = {
      width: clipperStyles.initWidth / imgHW.width,
      height: clipperStyles.initHeight / imgHW.height
    }

    // Used to determine the img's initial width/height
    let scaleRatio: number
    const scaleImg = (scaleRatio: number) => {
      imgHW.width *= scaleRatio
      imgHW.height *= scaleRatio
    }
    if (imgHW.width > imgHW.height) {
      scaleRatio = ratio.height
      scaleImg(scaleRatio)
    } else {
      scaleRatio = ratio.width
      scaleImg(scaleRatio)
    }
    if (imgHW.width < clipperStyles.initWidth || imgHW.height < clipperStyles.initHeight) {
      const scaleRatio = imgHW.height < clipperStyles.initHeight ? clipperStyles.initHeight / imgHW.height
       : clipperStyles.initWidth / imgHW.width
      scaleImg(scaleRatio)
    }

    const newStyles = {
      initWidth: imgHW.width,
      initHeight: imgHW.height,
      width: clipperStyles.width,
      height: clipperStyles.height,
      scale: clipperStyles.scale,
      x: clipperStyles.x,
      y: clipperStyles.y
    }
    Object.assign(layer.styles, newStyles)
    layer.clipPath = `path('${clipPath}')`
    return layer
  }
}


const mouseUtils = new MouseUtils()
export default mouseUtils
