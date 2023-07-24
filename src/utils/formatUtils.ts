import { IFormat, IImageFormat, ITextFormat, ITextShape, ITextStyleCopiedFormat, textStyleCopiedFormatKeys } from '@/interfaces/format'
import { AllLayerTypes, IGroup, IImage, IParagraph, IText } from '@/interfaces/layer'
import store from '@/store'
import { cloneDeep, pick } from 'lodash'
import frameUtils from './frameUtils'
import imageAdjustUtil from './imageAdjustUtil'
import layerUtils from './layerUtils'
import stepsUtils from './stepsUtils'
import textShapeUtils from './textShapeUtils'
import textUtils from './textUtils'
import tiptapUtils from './tiptapUtils'

class FormatUtils {
  copiedFormat: IFormat | undefined
  APPLICABLE_TYPES: { [key: string]: string[] } = {
    image: ['image', 'frame'],
    text: ['text']
  }

  isCurveText(textShape: ITextShape): boolean {
    return textShapeUtils.isCurvedText(textShape)
  }

  isApplicableType(copiedType: string, type: string): boolean {
    return (this.APPLICABLE_TYPES[copiedType] ?? []).includes(type)
  }

  extractTextFormat(text: IText): ITextFormat {
    const paragraphs = text.paragraphs
    const lastParagraph = paragraphs[paragraphs.length - 1]
    const spans = lastParagraph.spans
    const lastSpan = spans[spans.length - 1]
    const textStyleCopiedFormat = Object.fromEntries(
      textStyleCopiedFormatKeys.map(type => [type, cloneDeep(text.styles[type])])
    ) as ITextStyleCopiedFormat
    return {
      paragraphStyle: cloneDeep(lastParagraph.styles),
      spanStyle: cloneDeep(lastSpan.styles),
      ...textStyleCopiedFormat
    }
  }

  extractImageFormat(image: IImage): IImageFormat {
    return cloneDeep(image.styles.adjust)
  }

  copyTextFormat(text: IText) {
    const textFormat = this.extractTextFormat(text)
    this.saveFormat({
      type: 'text',
      content: textFormat
    })
  }

  copyImageFormat(image: IImage) {
    const imageFormat = this.extractImageFormat(image)
    this.saveFormat({
      type: 'image',
      content: imageFormat
    })
  }

  saveFormat(format: IFormat) {
    store.commit('SET_hasCopiedFormat', true)
    this.copiedFormat = format
  }

  applyTextParagraphsStyles(textParagraphsCopiedFormat: Pick<ITextFormat, 'paragraphStyle' | 'spanStyle'>, oldParagraphs: IParagraph[]): IParagraph[] {
    const { paragraphStyle, spanStyle } = textParagraphsCopiedFormat
    const paragraphs = cloneDeep(oldParagraphs) as IParagraph[]
    for (const paragraph of paragraphs) {
      paragraph.styles = cloneDeep(paragraphStyle)
      if (paragraph.spanStyle) {
        paragraph.spanStyle = tiptapUtils.textStyles(spanStyle)
      }
      for (const span of paragraph.spans) {
        span.styles = cloneDeep(spanStyle)
      }
    }
    return paragraphs
  }

  applyTextStyles(textFormat: ITextFormat, layer: IText, pageIndex: number, layerIndex: number, subLayerIndex = -1) {
    const textStyleCopiedFormat = pick(textFormat, textStyleCopiedFormatKeys) as ITextStyleCopiedFormat
    const paragraphs = this.applyTextParagraphsStyles(pick(textFormat, ['paragraphStyle', 'spanStyle']), layer.paragraphs)
    const preParams = textShapeUtils.getPreParams(layer)
    const isSubLayer = subLayerIndex !== -1
    layerUtils.updateSpecLayerData({
      pageIndex,
      layerIndex,
      styles: cloneDeep(textStyleCopiedFormat),
      props: { paragraphs },
      ...isSubLayer ? {
        subLayerIndex,
        type: ['text'],
      } : {}
    })
    if (this.isCurveText(textStyleCopiedFormat.textShape)) {
      const textProps = textShapeUtils.getCurveTextProps(layer)
      if (preParams.wasCurveText) {
        Object.assign(textProps, textShapeUtils.getNewAnchoredPosition(textShapeUtils.getPostParams(layer, preParams, textProps)))
      }
      layerUtils.updateLayerStyles(pageIndex, layerIndex, textProps, subLayerIndex)
      layerUtils.updateLayerProps(pageIndex, layerIndex, { widthLimit: -1 }, subLayerIndex)
    } else {
      const textHW = textUtils.getTextHW(layer, layer.widthLimit)
      layerUtils.updateLayerStyles(
        pageIndex,
        layerIndex,
        {
          width: textHW.width,
          height: textHW.height,
          ...textShapeUtils.getNewAnchoredPosition(textShapeUtils.getPostParams(layer, preParams, textHW))
        },
        subLayerIndex
      )
      layerUtils.updateLayerProps(pageIndex, layerIndex, { spanDataList: textHW.spanDataList }, subLayerIndex)
    }
  }

  applyImageStylesToFrame(adjust: IImageFormat, pageIndex: number, layerIndex: number, subLayerIndex = -1, isInGroup = false) {
    if (isInGroup || subLayerIndex === -1) { // frame in group or single frame without any clip selected
      frameUtils.updateFrameLayerAllClipsStyles(
        pageIndex,
        layerIndex,
        { adjust: cloneDeep(adjust) },
        subLayerIndex, // -1 if single frame without any clip selected, > 0 if frame in group
      )
    } else {
      frameUtils.updateFrameLayerStyles(
        pageIndex,
        layerIndex,
        subLayerIndex, // clipIndex
        { adjust: cloneDeep(adjust) }
      )
    }
  }

  applyFormatIfCopied(pageIndex: number, layerIndex: number, subLayerIndex = -1) {
    if (!this.copiedFormat) return
    const type = this.copiedFormat.type
    const layer = store.getters.getLayer(pageIndex, layerIndex)
    if (layer.type === 'group') { // subController or whole-group controller
      const subLayers = (layer as IGroup).layers
      const isSubController = subLayerIndex >= 0
      let layers: AllLayerTypes[]
      if (isSubController) {
        const subLayer = subLayers[subLayerIndex]
        if (!this.isApplicableType(type, subLayer.type)) return
        layers = [subLayer]
      } else {
        layers = subLayers
      }
      if (type === 'text') {
        const textFormat = this.copiedFormat.content as ITextFormat
        for (const targetLayerIndex in layers) {
          const idx = subLayerIndex >= 0 ? subLayerIndex : +targetLayerIndex
          const targetLayer = layers[targetLayerIndex]
          if (targetLayer.type !== 'text') continue
          this.applyTextStyles(textFormat, targetLayer, pageIndex, layerIndex, idx)
        }
        textUtils.updateGroupLayerSize(pageIndex, layerIndex)
      }
      if (type === 'image') {
        const adjust = this.copiedFormat.content as IImageFormat
        layerUtils.updateSpecLayerData({
          pageIndex,
          layerIndex,
          subLayerIndex: subLayerIndex >= 0 ? subLayerIndex : undefined,
          type: ['image'],
          styles: { adjust: cloneDeep(adjust) }
        })
        for (const targetLayerIndex in layers) {
          const idx = subLayerIndex >= 0 ? subLayerIndex : +targetLayerIndex
          const targetLayer = layers[targetLayerIndex]
          if (targetLayer.type !== 'frame') continue
          this.applyImageStylesToFrame(adjust, pageIndex, layerIndex, idx, true)
        }
      }
      stepsUtils.record()
    } else { // non-group controller
      if (!this.isApplicableType(type, layer.type)) return
      if (type === 'text') {
        const textFormat = this.copiedFormat.content as ITextFormat
        this.applyTextStyles(textFormat, layer, pageIndex, layerIndex)
      }
      if (type === 'image') {
        const adjust = this.copiedFormat.content as IImageFormat
        if (layer.type === 'image') {
          imageAdjustUtil.setAdjust({
            pageIndex,
            layerIndex,
            adjust: cloneDeep(adjust)
          })
        } else { // frame
          this.applyImageStylesToFrame(adjust, pageIndex, layerIndex, subLayerIndex, false)
        }
      }
      stepsUtils.record()
    }
  }

  clearCopiedFormat() {
    store.commit('SET_hasCopiedFormat', false)
    this.copiedFormat = undefined
  }
}

export default new FormatUtils()
