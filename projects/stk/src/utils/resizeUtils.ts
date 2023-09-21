/* eslint-disable indent */
import { IFrame, IImage, ILayer, IShape, IText } from '@/interfaces/layer'
import { IBleed, IPage } from '@/interfaces/page'
import store from '@/store'
import controlUtils from '@/utils/controlUtils'
import frameUtils from '@/utils/frameUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import shapeUtils from '@/utils/shapeUtils'
import unitUtils, { PRECISION } from '@/utils/unitUtils'
import { floor, isEqual, round } from 'lodash'
import rulerUtils from './rulerUtils'

class ResizeUtils {
  scaleAndMoveLayer(pageIndex: number, layerIndex: number, targetLayer: ILayer, targetScale: number, xOffset: number, yOffset: number) {
    const modifySourceLayer = pageIndex === -1
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
        if (modifySourceLayer) {
          layer.styles.imgWidth = imgWidth * targetScale
          layer.styles.imgHeight = imgHeight * targetScale
          layer.styles.imgX = imgX * targetScale
          layer.styles.imgY = imgY * targetScale
          break
        }
        imageUtils.updateImgSize(pageIndex, layerIndex, imgWidth * targetScale, imgHeight * targetScale)
        imageUtils.updateImgPos(pageIndex, layerIndex, imgX * targetScale, imgY * targetScale)
        // scale = 1
        break
      }
      case 'text':
        layer = targetLayer as IText
        if (layer.widthLimit !== -1) {
          if (modifySourceLayer) {
            layer.widthLimit = layer.styles.writingMode.includes('vertical') ? height : width
            break
          }
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

          if (modifySourceLayer) {
            layer.styles.initWidth = width
            layer.styles.initHeight = height
            Object.assign(layer.clips[0].styles, {
              width: width,
              height: height,
              imgWidth,
              imgHeight,
              imgX,
              imgY
            })
            break
          }
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
          const newStrokeWidth = round(strokeWidth * targetScale, 2)
          const { point, realWidth, realHeight } = shapeUtils.computePointForDimensions(quadrant, newStrokeWidth, lineWidth * targetScale, lineHeight * targetScale)
          width = realWidth
          height = realHeight
          scale = layer.styles.scale
          if (modifySourceLayer) {
            layer.point = point
            layer.styles.initWidth = width
            layer.styles.initHeight = height
            layer.size = [newStrokeWidth]
            break
          }
          controlUtils.updateShapeLinePoint(pageIndex, layerIndex, point)
          layerUtils.updateLayerStyles(pageIndex, layerIndex, {
            initWidth: width,
            initHeight: height
          })
          layerUtils.updateLayerProps(pageIndex, layerIndex, {
            size: [newStrokeWidth]
          })
        }
        if (layer.category === 'E') {
          const { size } = layer
          if (!size) break
          const strokeWidth = size[0]
          const newStrokeWidth = round(strokeWidth * targetScale, 2)
          scale = 1
          const corRad = controlUtils.getCorRadValue([width, height], controlUtils.getCorRadPercentage(layer.vSize, size, layer.shapeType ?? ''), layer.shapeType ?? '')
          if (modifySourceLayer) {
            layer.vSize = [width, height]
            layer.size = [newStrokeWidth, corRad]
            break
          }
          controlUtils.updateShapeVSize(pageIndex, layerIndex, [width, height])
          layerUtils.updateLayerProps(pageIndex, layerIndex, {
            size: [newStrokeWidth, corRad]
          })
        }
        break
      case 'tmp':
        throw new Error('Unexpected tmp layer encountered')
    }
    const trans = {
      x: targetLayer.styles.x * targetScale + xOffset,
      y: targetLayer.styles.y * targetScale + yOffset
    }

    if (modifySourceLayer) {
      targetLayer.styles.width = width
      targetLayer.styles.height = height
      targetLayer.styles.scale = scale
      targetLayer.styles.x = trans.x
      targetLayer.styles.y = trans.y
      return
    }
    controlUtils.updateLayerSize(pageIndex, layerIndex, width, height, scale)
    controlUtils.updateLayerPos(pageIndex, layerIndex, trans.x, trans.y)
  }

  scaleAndMoveGuideLines(guidelines: { v: number[], h: number[] }, scale: number, xOffset: number, yOffset: number) {
    guidelines.v = guidelines.v.map(vl => vl * scale + xOffset)
    guidelines.h = guidelines.h.map(hl => hl * scale + yOffset)
  }

  scaleAndMoveLayers(pageIndex: number, page: IPage, scale: number, xOffset: number, yOffset: number): IPage {
    const modifySourcePage = pageIndex === -1
    page.layers.forEach((layer, index) => {
      this.scaleAndMoveLayer(pageIndex, index, layer, scale, xOffset, yOffset)
      if (modifySourcePage) page.layers[index] = layer
    })
    if (page.guidelines) {
      this.scaleAndMoveGuideLines(page.guidelines, scale, xOffset, yOffset)
    }
    return page
  }

  scaleBackground(pageIndex: number, page: IPage, scale: number) {
    const modifySourcePage = pageIndex === -1
    const width = page.backgroundImage.config.styles.imgWidth * scale
    const height = page.backgroundImage.config.styles.imgHeight * scale
    if (modifySourcePage) {
      page.backgroundImage.posX = page.backgroundImage.posX * scale
      page.backgroundImage.posY = page.backgroundImage.posY * scale
      Object.assign(page.backgroundImage.config.styles, {
        width,
        height,
        imgWidth: width,
        imgHeight: height
      })
      return
    }
    pageUtils.updateBackgroundImagePos(pageIndex, page.backgroundImage.posX * scale, page.backgroundImage.posY * scale)
    pageUtils.updateBackgroundImageStyles(
      pageIndex, {
      width,
      height,
      imgWidth: width,
      imgHeight: height
    }
    )
  }

  /**
   * Resize page and update bleeds. set page to px size if any of physical format (physicalWidth, physicalHeight, unit) unspecified.
   * @param pageIndex Target page index
   * @param page Target page
   * @param format New size without bleeds
   * @param format.width New page width
   * @param format.height New page height
   * @param format.physicalWidth New psysical width, will be set to width if any of physical format unspecified
   * @param format.physicalHeight New psysical height, will be set to height if any of physical format unspecified
   * @param format.unit Unit of new size, will be set to px if any of physical format unspecified
   */
  resizePage(pageIndex: number, page: IPage, format: { width: number, height: number, physicalWidth?: number, physicalHeight?: number, unit?: string }) {
    const modifySourcePage = pageIndex === -1

    // set physical size to px size if not exist
    if (!(format.physicalWidth && format.physicalHeight && format.unit)) {
      format.physicalWidth = format.width
      format.physicalHeight = format.height
      format.unit = 'px'
    }

    const noBleed = { top: 0, bottom: 0, left: 0, right: 0 } as IBleed
    let bleeds = noBleed
    let physicalBleeds = noBleed
    const newDPI = pageUtils.getPageDPI({
      width: format.width,
      height: format.height,
      physicalWidth: format.physicalWidth,
      physicalHeight: format.physicalHeight,
      unit: format.unit
    })
    const newUnit = format.unit || 'px'
    if (page.isEnableBleed && page.bleeds && page.physicalBleeds) {
      bleeds = page.bleeds
      physicalBleeds = page.physicalBleeds

      // convert bleeds
      if (!(page.unit === 'px' && newUnit === 'px')) { // resize between px size is DPI indepandent
        const dpi = newUnit === 'px' ? unitUtils.getConvertDpi({
          physicalWidth: format.physicalWidth,
          physicalHeight: format.physicalHeight,
          unit: format.unit
        }) : newDPI
        const precision = newUnit === 'px' ? 0 : PRECISION
        const bleedDPI = (key: string): number => (key === 'left' || key === 'right') ? dpi.width : dpi.height
        const maxBleed = newUnit === 'px' ? pageUtils.MAX_BLEED.px : floor(unitUtils.convert(pageUtils.MAX_BLEED.mm, 'mm', newUnit), precision)
        const defaultBleedMap = pageUtils.getDefaultBleedMap(page, pageIndex)
        const isDefaultBleed = isEqual(defaultBleedMap[page.unit], physicalBleeds)
        const isFixPxSize = pageUtils.isDetailPage && newUnit !== 'px'

        // table search for default bleeds to prevent mismatch of default bleeds in different unit during conversion due to roundings
        if (isDefaultBleed) physicalBleeds = defaultBleedMap[newUnit]
        else {
          Object.keys(physicalBleeds).forEach(key => {
            physicalBleeds[key] = unitUtils.convert(physicalBleeds[key], page.unit, newUnit, bleedDPI(key))
            physicalBleeds[key] = round(physicalBleeds[key], precision)
            physicalBleeds[key] = Math.min(physicalBleeds[key], maxBleed)
          })
        }

        // prevent unnessary conversion, or px bleed may change due to roundings during conversion
        if (!isFixPxSize) {
          Object.keys(physicalBleeds).forEach(key => {
            bleeds[key] = unitUtils.convert(physicalBleeds[key], newUnit, 'px', bleedDPI(key))
            bleeds[key] = round(bleeds[key])
          })
        }

        // cap converted bleeds
        Object.keys(bleeds).forEach(key => {
          const pxMaxBleed = floor(unitUtils.convert(maxBleed, newUnit, 'px', bleedDPI(key)))
          bleeds[key] = Math.min(bleeds[key], pxMaxBleed)
        })
        if (modifySourcePage) {
          page.bleeds = { ...bleeds }
          page.physicalBleeds = { ...physicalBleeds }
        } else store.commit('SET_bleeds', { pageIndex, bleeds, physicalBleeds })
      }
    }

    // update layers
    const sizeWithBleeds = pageUtils.getPageSizeWithBleeds(page)
    const aspectRatio = page.width / page.height
    const targetAspectRatio = format.width / format.height
    let scale: number
    if (targetAspectRatio > aspectRatio) {
      scale = format.height / page.height
      this.scaleAndMoveLayers(pageIndex, page, scale, ((page.height * targetAspectRatio - page.width) / 2) * scale, 0)
    } else {
      scale = format.width / page.width
      this.scaleAndMoveLayers(pageIndex, page, scale, 0, ((page.width / targetAspectRatio - page.height) / 2) * scale)
    }

    // add bleeds to new size
    const newSize = {
      width: format.width + sizeWithBleeds.bleeds.left + sizeWithBleeds.bleeds.right,
      height: format.height + sizeWithBleeds.bleeds.top + sizeWithBleeds.bleeds.bottom,
      physicalWidth: format.physicalWidth + sizeWithBleeds.physicalBleeds.left + sizeWithBleeds.physicalBleeds.right,
      physicalHeight: format.physicalHeight + sizeWithBleeds.physicalBleeds.top + sizeWithBleeds.physicalBleeds.bottom,
      unit: format.unit
    }

    // update background
    if (Math.abs(targetAspectRatio - aspectRatio) < Number.EPSILON) {
      this.scaleBackground(pageIndex, page, scale)
    } else {
      // adapt to new size without bleeds if page is in pixel unit, or new size with bleeds if page is in physical unit.
      let { width, height, posX, posY } = imageUtils.adaptToSize({
        width: page.backgroundImage.config.styles.imgWidth || page.backgroundImage.config.styles.width || page.width,
        height: page.backgroundImage.config.styles.imgHeight || page.backgroundImage.config.styles.height || page.height
        // width: page.backgroundImage.config.styles.initWidth || page.backgroundImage.config.styles.width || page.width,
        // height: page.backgroundImage.config.styles.initHeight || page.backgroundImage.config.styles.height || page.height
      }, format.unit === 'px' ? format : newSize)
      if (format.unit !== 'px') {
        posX -= page.bleeds.left
        posY -= page.bleeds.top
      }
      if (modifySourcePage) {
        page.backgroundImage.posX = posX
        page.backgroundImage.posY = posY
        Object.assign(page.backgroundImage.config.styles, {
          width,
          height,
          imgWidth: width,
          imgHeight: height
        })
      } else {
        pageUtils.updateBackgroundImagePos(pageIndex, posX, posY)
        pageUtils.updateBackgroundImageStyles(
          pageIndex, {
          width,
          height,
          imgWidth: width,
          imgHeight: height
        })
      }
    }

    if (modifySourcePage) {
      const { guidelines } = page
      page.guidelines = {
        v: guidelines.v.filter((line) => line <= format.width),
        h: guidelines.h.filter((line) => line <= format.height)
      }
      page.width = format.width
      page.height = format.height
      page.physicalWidth = format.physicalWidth
      page.physicalHeight = format.physicalHeight
      page.unit = format.unit
      if (!page.isEnableBleed) pageUtils.resetBleeds(page)
    } else {
      rulerUtils.removeInvalidGuides(pageIndex, format)
      pageUtils.setPageSize(pageIndex, format.width, format.height, format.physicalWidth, format.physicalHeight, format.unit)
    }
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
