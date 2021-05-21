/**
 */
import store from '@/store'
import { ILayer, IStyle } from '@/interfaces/layer'
import GroupUtils from '@/utils/groupUtils'
import { SidebarPanelType } from '@/store/types'
import LayerFactary from '@/utils/layerFactary'
import { ICoordinate } from '@/interfaces/frame'
import ZindexUtils from '@/utils/zindexUtils'
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
    clipPath = '', clipperStyles: IStyle | null = null) {
    let layer = this.onDropHandler(e, pageIndex, targetOffset)

    if (layer && clipperStyles && layer.type === 'image') {
      layer = this.clipperHandler(layer, clipPath, clipperStyles)
      this.refreshLayers(pageIndex, layer)
    }
  }

  onDrop(e: DragEvent, pageIndex: number, targetOffset: ICoordinate = { x: 0, y: 0 }) {
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
    if (store.getters.getCurrSidebarPanelType === SidebarPanelType.bg) {
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
        scale: 1,
        scaleX: 0,
        scaleY: 0,
        rotate: 0,
        width: data.styles.width,
        height: data.styles.height,
        initWidth: data.styles.initWidth ? data.styles.initWidth : data.styles.width,
        initHeight: data.styles.initHeight ? data.styles.initHeight : data.styles.height,
        zindex: -1,
        opacity: 100
      }
    }

    let layer
    if (data.type === 'image') {
      const imgStyles = {
        imgX: 0,
        imgY: 0,
        imgWidth: layerConfig.styles.initWidth,
        imgHeight: layerConfig.styles.initHeight
      }
      Object.assign(layerConfig.styles, imgStyles)
      layer = LayerFactary.newImage(pageIndex, Object.assign(layerConfig, { src: data.src, imgControl: false }))
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
    ZindexUtils.reassignZindex(pageIndex)
    GroupUtils.deselect()
    store.commit('SET_lastSelectedPageIndex', pageIndex)
    const targetPage = document.querySelector(`.nu-page-${pageIndex}`) as HTMLElement
    targetPage.focus()
    GroupUtils.select([store.getters.getLayers(pageIndex).length - 1])
  }

  backgroundHandler(pageIndex: number, src: string) {
    store.commit('SET_backgroundImageSrc', {
      pageIndex: pageIndex,
      imageSrc: src
    })
  }

  clipperHandler(layer: ILayer, clipPath: string, clipperStyles: IStyle): ILayer {
    const img = {
      width: layer.styles.width,
      height: layer.styles.height
    }
    const ratio = {
      width: clipperStyles.initWidth / img.width,
      height: clipperStyles.initHeight / img.height
    }

    /**
     * Here's to determine the img's initial width/height
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
    layer.clipPath = `path('${clipPath}')`
    return layer
  }
}

const mouseUtils = new MouseUtils()
export default mouseUtils
