/* eslint-disable indent */
import { IFrame, IGroup, IImage, ILayer, IShape, IText, ITmp } from '@/interfaces/layer'
import { IBleed, IPage } from '@/interfaces/page'
import frameUtils from '@/utils/frameUtils'
import shapeUtils from '@/utils/shapeUtils'
import controlUtils from '@/utils/controlUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import rulerUtils from './rulerUtils'
import unitUtils, { PRECISION } from '@/utils/unitUtils'
import store from '@/store'
import { round, isEqual } from 'lodash'
import generalUtils from './generalUtils'

class ResizeUtils {
  scaleAndMoveLayer(pageIndex: number, layerIndex: number, targetLayer: ILayer, targetScale: number, xOffset: number, yOffset: number, reScaleShapeStrokeWidth = false) {
    if (!targetLayer.moved) {
      targetLayer.moved = true
    }

    let width = targetLayer.styles.width * targetScale
    let height = targetLayer.styles.height * targetScale
    let scale = targetLayer.styles.scale * targetScale

    let layer

    switch (targetLayer.type) {
      case 'image': {
        layer = targetLayer as IImage
        const { imgWidth, imgHeight, imgX, imgY } = (layer as IImage).styles
        imageUtils.updateImgSize(pageIndex, layerIndex, imgWidth * targetScale, imgHeight * targetScale)
        imageUtils.updateImgPos(pageIndex, layerIndex, imgX * targetScale, imgY * targetScale)
        // scale = 1
        break
      }
      case 'text':
        layer = targetLayer as IText
        if (layer.widthLimit !== -1) {
          controlUtils.updateLayerProps(pageIndex, layerIndex, {
            widthLimit: layer.styles.writingMode.includes('vertical') ? height : width
          })
        }
        break
      case 'frame': {
        layer = targetLayer as IFrame
        if (frameUtils.isImageFrame(layer)) {
          let { imgWidth, imgHeight, imgX, imgY } = layer.clips[0].styles
          imgWidth *= targetScale
          imgHeight *= targetScale
          imgY *= targetScale
          imgX *= targetScale

          layerUtils.updateLayerStyles(pageIndex, layerIndex, {
            initWidth: width,
            initHeight: height
          })
          frameUtils.updateFrameLayerStyles(pageIndex, layerIndex, 0, {
            width: width,
            height: height,
            imgWidth,
            imgHeight,
            imgX,
            imgY
          })
          // const clipPath = `M0,0h${width}v${height}h${-width}z`
          // frameUtils.updateFrameLayerProps(pageIndex, layerIndex, 0, { clipPath })
          // scale = 1
        }
        break
      }
      case undefined:
      case 'shape':
        layer = targetLayer as IShape
        if (layer.category === 'D') {
          const quadrant = shapeUtils.getLineQuadrant(layer.point ?? [])
          const { width: lineWidth, height: lineHeight } = shapeUtils.lineDimension(layer.point ?? [])
          const { size } = layer
          if (!size) break
          const strokeWidth = size[0]
          const newStrokeWidth = reScaleShapeStrokeWidth ? Math.round(strokeWidth * targetScale) : strokeWidth
          const { point, realWidth, realHeight } = shapeUtils.computePointForDimensions(quadrant, newStrokeWidth, lineWidth * targetScale, lineHeight * targetScale)
          controlUtils.updateShapeLinePoint(pageIndex, layerIndex, point)
          width = realWidth
          height = realHeight
          layerUtils.updateLayerStyles(pageIndex, layerIndex, {
            initWidth: width,
            initHeight: height
          })
          scale = layer.styles.scale
          layerUtils.updateLayerProps(pageIndex, layerIndex, {
            size: [newStrokeWidth]
          })
        }
        if (layer.category === 'E') {
          const { size } = layer
          if (!size) break
          const strokeWidth = size[0]
          const newStrokeWidth = reScaleShapeStrokeWidth ? Math.round(strokeWidth * targetScale) : strokeWidth
          scale = 1
          const corRad = controlUtils.getCorRadValue([width, height], controlUtils.getCorRadPercentage(layer.vSize, size, layer.shapeType ?? ''), layer.shapeType ?? '')
          controlUtils.updateShapeVSize(pageIndex, layerIndex, [width, height])
          layerUtils.updateLayerProps(pageIndex, layerIndex, {
            size: [newStrokeWidth, corRad]
          })
        }
        break
      case 'group':
        layer = targetLayer as IGroup
        layer.layers.forEach((subLayer, index) => {
          if (subLayer.type === 'shape') {
            subLayer = subLayer as IShape
            if (subLayer.category === 'D') {
              const [strokeWidth] = subLayer.size ?? [1]
              const newStrokeWidth = reScaleShapeStrokeWidth ? strokeWidth : Math.round(strokeWidth / targetScale)
              layerUtils.updateSubLayerProps(pageIndex, layerIndex, index, {
                size: [newStrokeWidth]
              })
              const trans = shapeUtils.getTranslateCompensationForLineWidth(subLayer.point ?? [], subLayer.styles, strokeWidth, newStrokeWidth)
              layerUtils.updateSubLayerStyles(pageIndex, layerIndex, index, {
                x: trans.x,
                y: trans.y
              })
            }
            if (subLayer.category === 'E') {
              const [strokeWidth, corRad] = subLayer.size ?? [1, 0]
              const newStrokeWidth = reScaleShapeStrokeWidth ? strokeWidth : Math.round(strokeWidth / targetScale)
              layerUtils.updateSubLayerProps(pageIndex, layerIndex, index, {
                size: [newStrokeWidth, corRad]
              })
            }
          }
        })
        break
      case 'tmp':
        throw new Error('Unexpected tmp layer encountered')
    }
    const trans = {
      x: targetLayer.styles.x * targetScale + xOffset,
      y: targetLayer.styles.y * targetScale + yOffset
    }

    controlUtils.updateLayerSize(pageIndex, layerIndex, width, height, scale)
    controlUtils.updateLayerPos(pageIndex, layerIndex, trans.x, trans.y)
  }

  scaleAndMoveGuideLines(guidelines: { v: number[], h: number[] }, scale: number, xOffset: number, yOffset: number) {
    guidelines.v = guidelines.v.map(vl => vl * scale + xOffset)
    guidelines.h = guidelines.h.map(hl => hl * scale + yOffset)
  }

  scaleAndMoveLayers(pageIndex: number, page: IPage, scale: number, xOffset: number, yOffset: number, reScaleShapeStrokeWidth = false): IPage {
    page.layers.forEach((layer, index) => {
      this.scaleAndMoveLayer(pageIndex, index, layer, scale, xOffset, yOffset, reScaleShapeStrokeWidth)
    })
    if (page.guidelines) {
      this.scaleAndMoveGuideLines(page.guidelines, scale, xOffset, yOffset)
    }
    return page
  }

  scaleBackground(pageIndex: number, page: IPage, scale: number) {
    pageUtils.updateBackgroundImagePos(pageIndex, page.backgroundImage.posX * scale, page.backgroundImage.posY * scale)
    const width = page.backgroundImage.config.styles.imgWidth * scale
    const height = page.backgroundImage.config.styles.imgHeight * scale
    pageUtils.updateBackgroundImageStyles(
      pageIndex, {
      width,
      height,
      imgWidth: width,
      imgHeight: height
    }
    )
  }

  centerBackground(pageIndex: number, page: IPage, format: { width: number, height: number }) {
    const { width, height, posX, posY } = imageUtils.adaptToSize({
      width: page.backgroundImage.config.styles.imgWidth || page.backgroundImage.config.styles.width || page.width,
      height: page.backgroundImage.config.styles.imgHeight || page.backgroundImage.config.styles.height || page.height
      // width: page.backgroundImage.config.styles.initWidth || page.backgroundImage.config.styles.width || page.width,
      // height: page.backgroundImage.config.styles.initHeight || page.backgroundImage.config.styles.height || page.height
    }, format)
    pageUtils.updateBackgroundImagePos(pageIndex, posX, posY)
    pageUtils.updateBackgroundImageStyles(
      pageIndex, {
      width,
      height,
      imgWidth: width,
      imgHeight: height
    }
    )
  }

  resizePage(pageIndex: number, page: IPage, format: { width: number, height: number, physicalWidth?: number, physicalHeight?: number, unit?: string }, reScaleShapeStrokeWidth = false) {
    // set physical size to px size if not exist
    format.physicalWidth ||= format.width
    format.physicalHeight ||= format.height
    format.unit ||= 'px'

    const noBleed = { top: 0, bottom: 0, left: 0, right: 0 } as IBleed
    let bleeds = noBleed
    let physicalBleeds = noBleed
    if (page.isEnableBleed && page.bleeds && page.physicalBleeds) {
      bleeds = page.bleeds
      physicalBleeds = page.physicalBleeds
      if (format.unit !== page.unit) {
        // convert bleeds
        let dpi: { width: number, height: number }
        if (format.unit !== 'px') {
          dpi = {
            width: format.width / unitUtils.convert(format.physicalWidth, format.unit, 'in'),
            height: format.height / unitUtils.convert(format.physicalHeight, format.unit, 'in')
          }
        } else {
          const pxSize = unitUtils.convertSize(page.physicalWidth, page.physicalHeight, page.unit, 'px')
          dpi = {
            width: pxSize.width / unitUtils.convert(page.physicalWidth, page.unit, 'in'),
            height: pxSize.height / unitUtils.convert(page.physicalHeight, page.unit, 'in')
          }
        }
        const unit = format.unit || 'px'
        physicalBleeds = page.unit !== 'px' && unit !== 'px' && isEqual(pageUtils.defaultBleedMap[page.unit], physicalBleeds) ? pageUtils.defaultBleedMap[unit]
                          : Object.fromEntries(Object.entries(physicalBleeds).map(([k, v]) => [k, round(unitUtils.convert(v, page.unit, unit, (k === 'left' || k === 'right') ? dpi.width : dpi.height), unit === 'px' ? 0 : PRECISION)])) as IBleed
        bleeds = Object.fromEntries(Object.entries(physicalBleeds).map(([k, v]) => [k, round(unitUtils.convert(v, unit, 'px', (k === 'left' || k === 'right') ? dpi.width : dpi.height))])) as IBleed
      }
      store.commit('UPDATE_pageProps', {
        pageIndex: pageIndex,
        props: { bleeds, physicalBleeds }
      })
    } else {
      // update default bleeds with new dpi
      let dpi: { width: number, height: number }
      if (format.unit !== 'px') {
        dpi = {
          width: format.width / unitUtils.convert(format.physicalWidth, format.unit, 'in'),
          height: format.height / unitUtils.convert(format.physicalHeight, format.unit, 'in')
        }
      } else {
        const inSize = unitUtils.convertSize(format.physicalWidth, format.physicalHeight, format.unit, 'in')
        dpi = {
          width: format.width / inSize.width,
          height: format.height / inSize.height
        }
      }
      const bleeds = pageUtils.getDefaultBleeds('px', dpi)
      store.commit('UPDATE_pageProps', {
        pageIndex: pageIndex,
        props: {
          bleeds,
          physicalBleeds: format.unit === 'px' ? bleeds : pageUtils.getDefaultBleeds(format.unit, dpi)
        }
      })
    }

    const sizeWithoutBleed = pageUtils.getPageSizeWithBleeds(page)
    const aspectRatio = page.width / page.height
    const targetAspectRatio = format.width / format.height
    let scale: number
    if (targetAspectRatio > aspectRatio) {
      scale = format.height / sizeWithoutBleed.height
      const offsetBleed = page.isEnableBleed ? { left: bleeds.left - page.bleeds.left * scale, top: bleeds.top - page.bleeds.top * scale } : { left: 0, top: 0 }
      this.scaleAndMoveLayers(pageIndex, page, scale, ((sizeWithoutBleed.height * targetAspectRatio - sizeWithoutBleed.width) / 2) * scale + offsetBleed.left, offsetBleed.top, reScaleShapeStrokeWidth)
    } else {
      scale = format.width / sizeWithoutBleed.width
      const offsetBleed = page.isEnableBleed ? { left: bleeds.left - page.bleeds.left * scale, top: bleeds.top - page.bleeds.top * scale } : { left: 0, top: 0 }
      this.scaleAndMoveLayers(pageIndex, page, scale, offsetBleed.left, ((sizeWithoutBleed.width / targetAspectRatio - sizeWithoutBleed.height) / 2) * scale + offsetBleed.top, reScaleShapeStrokeWidth)
    }

    // add bleed to new size
    format.width = format.width + bleeds.left + bleeds.right
    format.height = format.height + bleeds.top + bleeds.bottom
    format.physicalWidth = format.physicalWidth + physicalBleeds.left + physicalBleeds.right
    format.physicalHeight = format.physicalHeight + physicalBleeds.top + physicalBleeds.bottom

    scale = targetAspectRatio > aspectRatio ? format.height / page.height : format.width / page.width
    if (Math.abs(targetAspectRatio - aspectRatio) < Number.EPSILON) {
      this.scaleBackground(pageIndex, page, scale)
    } else {
      this.centerBackground(pageIndex, page, format)
    }
    rulerUtils.removeInvalidGuides(pageIndex, format)

    store.commit('UPDATE_pageProps', {
      pageIndex: pageIndex,
      props: { ...format }
    })
  }

  resizeBleeds(pageIndex: number, physicalBleeds: IBleed, bleeds?: IBleed) {
    const page = pageUtils.getPage(pageIndex)
    const { width, height, physicalWidth, physicalHeight, unit } = pageUtils.getPageSizeWithBleeds(page)

    // convert bleeds
    const dpi = pageUtils.getPageDPI(page)
    physicalBleeds = Object.fromEntries(Object.entries(physicalBleeds).map(([k, v]) => [k, isNaN(v) ? 0 : v])) as IBleed // map NaN to 0
    const newBleeds = bleeds || Object.fromEntries(Object.entries(physicalBleeds).map(([k, v]) => [k, round(unitUtils.convert(v, unit, 'px', k === 'left' || k === 'right' ? dpi.width : dpi.height))])) as IBleed // convert bleed to px size
    const newPhysicalBleeds = physicalBleeds

    // resize page
    const newSize = { width: width + newBleeds.left + newBleeds.right, height: height + newBleeds.top + newBleeds.bottom }
    const aspectRatio = width / height
    const targetAspectRatio = newSize.width / newSize.height
    this.scaleAndMoveLayers(pageIndex, page, 1, newBleeds.left - (page.isEnableBleed ? page.bleeds.left : 0), newBleeds.top - (page.isEnableBleed ? page.bleeds.top : 0))
    if (Math.abs(targetAspectRatio - aspectRatio) < Number.EPSILON) {
      const scale = targetAspectRatio > aspectRatio ? newSize.height / page.height : newSize.width / page.width
      this.scaleBackground(pageIndex, page, scale)
    } else {
      this.centerBackground(pageIndex, page, newSize)
    }
    rulerUtils.removeInvalidGuides(pageIndex, newSize)

    // update page size and bleeds
    store.commit('UPDATE_pageProps', {
      pageIndex: pageIndex,
      props: {
        width: newSize.width,
        height: newSize.height,
        physicalWidth: physicalWidth + newPhysicalBleeds.left + newPhysicalBleeds.right,
        physicalHeight: physicalHeight + newPhysicalBleeds.top + newPhysicalBleeds.bottom,
        unit: unit
      }
    })
    store.commit('SET_bleeds', { pageIndex, bleeds: newBleeds, physicalBleeds: newPhysicalBleeds })
  }

  disableBleeds(pageIndex: number) {
    const page = pageUtils.getPage(pageIndex)
    if (!page.isEnableBleed) return
    const sizeWithoutBleed = pageUtils.getPageSizeWithBleeds(page)
    const unit = sizeWithoutBleed.unit

    // resize page
    const aspectRatio = page.width / page.height
    const targetAspectRatio = sizeWithoutBleed.width / sizeWithoutBleed.height
    this.scaleAndMoveLayers(pageIndex, page, 1, -page.bleeds.left, -page.bleeds.top)
    if (Math.abs(targetAspectRatio - aspectRatio) < Number.EPSILON) {
      const scale = targetAspectRatio > aspectRatio ? sizeWithoutBleed.height / page.height : sizeWithoutBleed.width / page.width
      this.scaleBackground(pageIndex, page, scale)
    } else {
      this.centerBackground(pageIndex, page, sizeWithoutBleed)
    }
    rulerUtils.removeInvalidGuides(pageIndex, sizeWithoutBleed)

    // get default bleeds with page dpi
    let dpi: { width: number, height: number }
    if (unit !== 'px') {
      dpi = {
        width: sizeWithoutBleed.width / unitUtils.convert(sizeWithoutBleed.physicalWidth, unit, 'in'),
        height: sizeWithoutBleed.height / unitUtils.convert(sizeWithoutBleed.physicalHeight, unit, 'in')
      }
    } else {
      const inSize = unitUtils.convertSize(sizeWithoutBleed.physicalWidth, sizeWithoutBleed.physicalHeight, page.unit, 'in')
      dpi = {
        width: sizeWithoutBleed.width / inSize.width,
        height: sizeWithoutBleed.height / inSize.height
      }
    }
    const bleeds = pageUtils.getDefaultBleeds('px', dpi)

    // update page size
    store.commit('UPDATE_pageProps', {
      pageIndex: pageIndex,
      props: {
        width: sizeWithoutBleed.width,
        height: sizeWithoutBleed.height,
        physicalWidth: sizeWithoutBleed.physicalWidth,
        physicalHeight: sizeWithoutBleed.physicalHeight,
        unit,
        bleeds,
        physicalBleeds: unit === 'px' ? bleeds : pageUtils.getDefaultBleeds(unit, dpi)
      }
    })

    // disable bleed for page
    store.commit('UPDATE_pageProps', {
      pageIndex,
      props: { isEnableBleed: false }
    })
  }

  testResizeAllPages() {
    const { getPages: pages } = pageUtils

    pages.forEach((page, index) => {
      this.resizePage(index, page, { width: 116, height: 116 })
      store.commit('UPDATE_pageProps', {
        pageIndex: 0,
        props: { width: 116, height: 116 }
      })
    })
  }
}

export default new ResizeUtils()
