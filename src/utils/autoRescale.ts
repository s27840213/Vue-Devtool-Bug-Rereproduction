import { AllLayerTypes, IText } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { LayerType } from '@/store/types'
import layerUtils from './layerUtils'
import mathUtils from './mathUtils'
import pageUtils from './pageUtils'
import textUtils from './textUtils'

export default class AutoRescale {
  pageIndex: number
  layerIndex: number
  scale: number

  constructor(pageIndex = layerUtils.pageIndex, layerIndex = layerUtils.layerIndex) {
    const config = layerUtils.getLayer(pageIndex, layerIndex)
    this.pageIndex = pageIndex
    this.layerIndex = layerIndex
    this.scale = config?.styles?.scale ?? 1
  }

  getAutoRescaleResult(
    { forceFull = false, onlyCentralize = false } = {},
    config: IText,
    textHW: { width: number, height: number },
    x: number,
    y: number
  ): {
    textHW: { width: number, height: number },
    x: number,
    y: number,
    scale: number
  } {
    textHW = textUtils.getTextHW(config, config.widthLimit)
    const isVertical = config.styles.writingMode.includes('vertical')
    const page = pageUtils.getPage(this.pageIndex) as IPage
    const pageSize = page[isVertical ? 'height' : 'width']
    const newTmpTextSize = textHW[isVertical ? 'height' : 'width']
    const oldCenter = mathUtils.getCenter({
      x: 0,
      y: 0,
      width: page.width,
      height: page.height
    })
    let scale = config.styles.scale
    if (!onlyCentralize && (newTmpTextSize >= pageSize || forceFull)) {
      let rescale = pageSize / newTmpTextSize
      scale = config.styles.scale * rescale
      if (scale > 1) {
        rescale = 1 / config.styles.scale
        scale = 1
      }
      textHW = {
        width: isVertical ? textHW.width * rescale : pageSize,
        height: isVertical ? pageSize : textHW.height * rescale
      }
      x = isVertical ? x : 0
      y = isVertical ? 0 : y
    }
    const newCenter = mathUtils.getCenter({
      width: textHW.width,
      height: textHW.height,
      x,
      y
    })

    const offset = { x: oldCenter.x - newCenter.x, y: oldCenter.y - newCenter.y }
    x += offset.x
    y += offset.y
    return { textHW, x, y, scale }
  }

  handleAutoRescale(options?: { forceFull?: boolean, onlyCentralize?: boolean }) {
    const config = layerUtils.getLayer(this.pageIndex, this.layerIndex) as AllLayerTypes
    if (config?.type !== LayerType.text) return
    if (config.widthLimit !== -1 || config.styles.rotate !== 0 || !config.inAutoRescaleMode) return
    const { textHW, x, y, scale } = this.getAutoRescaleResult(
      options,
      config,
      textUtils.getTextHW(config, config.widthLimit),
      config.styles.x,
      config.styles.y
    )
    layerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { x, y, width: textHW.width, height: textHW.height, scale })
  }

  static getAutoRescaleResult(
    pageIndex = layerUtils.pageIndex, layerIndex = layerUtils.layerIndex,
    config: IText,
    textHW: { width: number, height: number },
    x: number,
    y: number,
    options?: { forceFull?: boolean, onlyCentralize?: boolean }
  ): {
    textHW: { width: number, height: number },
    x: number,
    y: number,
    scale: number
  } {
    return (new AutoRescale(pageIndex, layerIndex)).getAutoRescaleResult(
      options,
      config,
      textHW,
      x,
      y
    )
  }

  static handleAutoRescale(pageIndex = layerUtils.pageIndex, layerIndex = layerUtils.layerIndex, options?: { forceFull?: boolean, onlyCentralize?: boolean }) {
    (new AutoRescale(pageIndex, layerIndex)).handleAutoRescale(options)
  }
}
