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

class ResizeUtils {
  scaleAndMoveLayer(pageIndex: number, layerIndex: number, targetLayer: ILayer, targetScale: number, xOffset: number, yOffset: number) {
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
          const { point, realWidth, realHeight } = shapeUtils.computePointForDimensions(quadrant, layer.size?.[0] ?? 1, lineWidth * targetScale, lineHeight * targetScale)
          controlUtils.updateShapeLinePoint(pageIndex, layerIndex, point)
          width = realWidth
          height = realHeight
          layerUtils.updateLayerStyles(pageIndex, layerIndex, {
            initWidth: width,
            initHeight: height
          })
          scale = layer.styles.scale
        }
        if (layer.category === 'E') {
          scale = 1
          const corRad = controlUtils.getCorRadValue([width, height], controlUtils.getCorRadPercentage(layer.vSize, layer.size ?? [], layer.shapeType ?? ''), layer.shapeType ?? '')
          controlUtils.updateShapeVSize(pageIndex, layerIndex, [width, height])
          controlUtils.updateShapeCorRad(pageIndex, layerIndex, layer.size ?? [], corRad)
        }
        break
      case 'group':
        layer = targetLayer as IGroup
        layer.layers.forEach((subLayer, index) => {
          if (subLayer.type === 'shape') {
            subLayer = subLayer as IShape
            if (subLayer.category === 'D') {
              const [lineWidth] = subLayer.size ?? [1]
              layerUtils.updateSubLayerProps(pageIndex, layerIndex, index, {
                size: [lineWidth / targetScale]
              })
              const trans = shapeUtils.getTranslateCompensationForLineWidth(subLayer.point ?? [], subLayer.styles, lineWidth, lineWidth / targetScale)
              layerUtils.updateSubLayerStyles(pageIndex, layerIndex, index, {
                x: trans.x,
                y: trans.y
              })
            }
            if (subLayer.category === 'E') {
              const [lineWidth, corRad] = subLayer.size ?? [1, 0]
              layerUtils.updateSubLayerProps(pageIndex, layerIndex, index, {
                size: [lineWidth / targetScale, corRad]
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

  scaleAndMoveLayers(pageIndex: number, page: IPage, scale: number, xOffset: number, yOffset: number): IPage {
    page.layers.forEach((layer, index) => {
      this.scaleAndMoveLayer(pageIndex, index, layer, scale, xOffset, yOffset)
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

  /**
   * Resize page and update bleeds.
   * @param pageIndex Target page index
   * @param page Target page
   * @param format New size without bleeds
   */
  resizePage(pageIndex: number, page: IPage, format: { width: number, height: number, physicalWidth?: number, physicalHeight?: number, unit?: string }) {
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
      // convert bleeds if unit changes
      if (format.unit !== page.unit) {
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
        store.commit('UPDATE_pageProps', {
          pageIndex: pageIndex,
          props: { bleeds, physicalBleeds }
        })
      }
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
      physicalWidth: format.width + sizeWithBleeds.physicalBleeds.left + sizeWithBleeds.physicalBleeds.right,
      physicalHeight: format.height + sizeWithBleeds.physicalBleeds.top + sizeWithBleeds.physicalBleeds.bottom,
      unit: format.unit
    }

    // update background
    if (Math.abs(targetAspectRatio - aspectRatio) < Number.EPSILON) {
      this.scaleBackground(pageIndex, page, scale)
    } else {
      // adapt to new size without bleeds if page is in pixel unit, or new size with bleeds if page is in physical unit.
      let { width, height, posX, posY } = imageUtils.adaptToSize({
        width: page.backgroundImage.config.styles.initWidth || page.backgroundImage.config.styles.width,
        height: page.backgroundImage.config.styles.initHeight || page.backgroundImage.config.styles.height
      }, format.unit === 'px' ? format : newSize)
      if (format.unit !== 'px') {
        posX -= page.bleeds.left
        posY -= page.bleeds.top
      }
      pageUtils.updateBackgroundImagePos(pageIndex, posX, posY)
      pageUtils.updateBackgroundImageStyles(
        pageIndex, {
        width,
        height,
        imgWidth: width,
        imgHeight: height
      })
    }

    rulerUtils.removeInvalidGuides(pageIndex, newSize)

    store.commit('UPDATE_pageProps', {
      pageIndex: pageIndex,
      props: { ...format }
    })
  }

  resizeBleeds(pageIndex: number, physicalBleeds: IBleed, bleeds?: IBleed) {
    const page = pageUtils.getPage(pageIndex)

    // convert bleeds
    const dpi = pageUtils.getPageDPI(page)
    physicalBleeds = Object.fromEntries(Object.entries(physicalBleeds).map(([k, v]) => [k, isNaN(v) ? 0 : v])) as IBleed // map NaN to 0
    const newBleeds = bleeds || Object.fromEntries(Object.entries(physicalBleeds).map(([k, v]) => [k, round(unitUtils.convert(v, page.unit, 'px', k === 'left' || k === 'right' ? dpi.width : dpi.height))])) as IBleed // convert bleed to px size
    const newPhysicalBleeds = physicalBleeds
    store.commit('SET_bleeds', { pageIndex, bleeds: newBleeds, physicalBleeds: newPhysicalBleeds })
  }

  enableBleeds(pageIndex: number) {
    const page = pageUtils.getPage(pageIndex)
    if (page.physicalBleeds && page.bleeds) this.resizeBleeds(pageIndex, page.physicalBleeds, page.bleeds)
    // else {
    //   const unit = page.unit ?? 'px'
    //   const defaultBleeds = pageUtils.getDefaultBleeds('px')
    //   defaultBleeds.top = this.groupType === 1 && pageIndex !== 0 ? 0 : defaultBleeds.top
    //   defaultBleeds.bottom = this.groupType === 1 && pageIndex !== this.pagesLength - 1 ? 0 : defaultBleeds.bottom

    //   const defaultPhysicalBleeds = unit === 'px' ? defaultBleeds : pageUtils.getDefaultBleeds(unit, pageUtils.getPageDPI(page))
    //   if (unit !== 'px') {
    //     defaultPhysicalBleeds.top = this.groupType === 1 && pageIndex !== 0 ? 0 : defaultPhysicalBleeds.top
    //     defaultPhysicalBleeds.bottom = this.groupType === 1 && pageIndex !== this.pagesLength - 1 ? 0 : defaultPhysicalBleeds.bottom
    //   }
    //   this.resizeBleeds(pageIndex, defaultPhysicalBleeds, defaultBleeds)
    // }
    store.commit('UPDATE_pageProps', {
      pageIndex,
      props: { isEnableBleed: true }
    })
  }

  disableBleeds(pageIndex: number) {
    const page = pageUtils.getPage(pageIndex)
    if (!page.isEnableBleed) return

    // update default bleeds
    const sizeWithoutBleed = pageUtils.getPageSize(pageIndex)
    const unit = sizeWithoutBleed.unit
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
    store.commit('UPDATE_pageProps', {
      pageIndex: pageIndex,
      props: {
        isEnableBleed: false,
        bleeds,
        physicalBleeds: unit === 'px' ? bleeds : pageUtils.getDefaultBleeds(unit, dpi)
      }
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
