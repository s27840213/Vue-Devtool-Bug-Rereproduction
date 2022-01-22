import store from '@/store'
import { ITextFormat, IImageFormat, IFormat } from '@/interfaces/format'
import { IFrame, IGroup, IImage, ILayer, IParagraph, IText } from '@/interfaces/layer'
import generalUtils from './generalUtils'
import tiptapUtils from './tiptapUtils'
import layerUtils from './layerUtils'
import textUtils from './textUtils'
import controlUtils from './controlUtils'
import stepsUtils from './stepsUtils'
import imageAdjustUtil from './imageAdjustUtil'
import frameUtils from './frameUtils'

class FormatUtils {
  copiedFormat: IFormat | undefined
  APPLICABLE_TYPES: {[key: string]: string[]} = {
    image: ['image', 'frame'],
    text: ['text']
  }

  isCurveText(textShape: any): boolean {
    return textShape.name === 'curve'
  }

  isApplicableType(copiedType: string, type: string): boolean {
    return (this.APPLICABLE_TYPES[copiedType] ?? []).includes(type)
  }

  extractTextFormat(text: IText): ITextFormat {
    const paragraphs = text.paragraphs
    const lastParagraph = paragraphs[paragraphs.length - 1]
    const spans = lastParagraph.spans
    const lastSpan = spans[spans.length - 1]
    return {
      paragraphStyle: generalUtils.deepCopy(lastParagraph.styles),
      spanStyle: generalUtils.deepCopy(lastSpan.styles),
      scale: text.styles.scale,
      textEffect: generalUtils.deepCopy((text as any).styles.textEffect),
      textShape: generalUtils.deepCopy((text as any).styles.textShape)
    }
  }

  extractImageFormat(image: any): IImageFormat {
    return generalUtils.deepCopy(image.styles.adjust)
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
    console.log(format)
    store.commit('SET_hasCopiedFormat', true)
    this.copiedFormat = format
  }

  applyTextStyles(oldParagraphs: IParagraph[]): IParagraph[] {
    if (!this.copiedFormat) return oldParagraphs
    const { paragraphStyle, spanStyle } = this.copiedFormat.content as ITextFormat
    const paragraphs = generalUtils.deepCopy(oldParagraphs) as IParagraph[]
    for (const paragraph of paragraphs) {
      paragraph.styles = generalUtils.deepCopy(paragraphStyle)
      if (paragraph.spanStyle) {
        paragraph.spanStyle = tiptapUtils.textStyles(spanStyle)
      }
      for (const span of paragraph.spans) {
        span.styles = generalUtils.deepCopy(spanStyle)
      }
    }
    return paragraphs
  }

  applyFormatIfCopied(pageIndex: number, layerIndex: number, subLayerIndex = -1) {
    if (!this.copiedFormat) return
    const type = this.copiedFormat.type
    const layer = store.getters.getLayer(pageIndex, layerIndex)
    if (layer.type === 'group') { // subController or whole-group controller
      const subLayers = (layer as IGroup).layers
      const isSubController = subLayerIndex >= 0
      let layers: ILayer[]
      if (isSubController) {
        const subLayer = subLayers[subLayerIndex] as ILayer
        if (!this.isApplicableType(type, subLayer.type)) return
        layers = [subLayer]
      } else {
        layers = subLayers
      }
      if (type === 'text') {
        const { scale, textEffect, textShape } = this.copiedFormat.content as ITextFormat
        layerUtils.updateSpecLayerData({
          pageIndex,
          layerIndex,
          subLayerIndex: subLayerIndex >= 0 ? subLayerIndex : undefined,
          type: ['text'],
          styles: {
            textEffect: { ...textEffect },
            textShape: { ...textShape },
            scale
          }
        })
        const isNotCurved = !this.isCurveText(textShape)
        for (const targetLayerIndex in layers) {
          const targetLayer = layers[targetLayerIndex]
          if (targetLayer.type !== 'text') continue
          const targetTextLayer = targetLayer as any
          const paragraphs = this.applyTextStyles(targetTextLayer.paragraphs)
          layerUtils.updateSubLayerProps(
            pageIndex,
            layerIndex,
            subLayerIndex >= 0 ? subLayerIndex : +targetLayerIndex,
            { paragraphs }
          )
          if (isNotCurved) {
            const newSize = textUtils.getTextHW(targetTextLayer, targetTextLayer.styles.widthLimit)
            layerUtils.updateSubLayerStyles(
              pageIndex,
              layerIndex,
              subLayerIndex >= 0 ? subLayerIndex : +targetLayerIndex,
              newSize
            )
          }
        }
        textUtils.updateGroupLayerSize(pageIndex, layerIndex)
        stepsUtils.record()
      }
      if (type === 'image') {
        const adjust = this.copiedFormat.content as IImageFormat
        if (isSubController) {
          frameUtils.updateSubFrameLayerAllClipsStyles(
            pageIndex,
            layerIndex,
            subLayerIndex,
            { adjust: { ...adjust } }
          )
        } else {
          for (const targetLayerIndex in layers) {
            const targetLayer = layers[targetLayerIndex]
            if (targetLayer.type !== 'frame') continue
            frameUtils.updateSubFrameLayerAllClipsStyles(
              pageIndex,
              layerIndex,
              +targetLayerIndex,
              { adjust: { ...adjust } }
            )
          }
        }
        layerUtils.updateSpecLayerData({
          pageIndex,
          layerIndex,
          subLayerIndex: subLayerIndex >= 0 ? subLayerIndex : undefined,
          type: ['image'],
          styles: { adjust: { ...adjust } }
        })
        stepsUtils.record()
      }
    } else { // non-group controller
      if (!this.isApplicableType(type, layer.type)) return
      if (type === 'text') {
        const { scale, textEffect, textShape } = this.copiedFormat.content as ITextFormat
        const paragraphs = this.applyTextStyles(layer.paragraphs)
        layerUtils.updateLayerProps(pageIndex, layerIndex, { paragraphs })
        layerUtils.updateLayerStyles(pageIndex, layerIndex, { scale })
        layerUtils.updateSpecLayerData({
          pageIndex,
          layerIndex,
          styles: {
            textEffect: { ...textEffect },
            textShape: { ...textShape }
          }
        })
        if (!this.isCurveText(textShape)) {
          const text = store.getters.getLayer(pageIndex, layerIndex)
          const newSize = textUtils.getTextHW(text, text.styles.widthLimit)
          controlUtils.updateLayerSize(pageIndex, layerIndex, newSize.width, newSize.height, text.styles.scale)
        }
        stepsUtils.record()
      }
      if (type === 'image') {
        const adjust = this.copiedFormat.content as IImageFormat
        if (layer.type === 'image') {
          imageAdjustUtil.setAdjust({
            pageIndex,
            layerIndex,
            adjust: { ...adjust }
          })
        } else { // frame
          if (subLayerIndex >= 0) { // a clip is selected
            frameUtils.updateFrameLayerStyles(
              pageIndex,
              layerIndex,
              subLayerIndex,
              { adjust: { ...adjust } }
            )
          } else {
            frameUtils.updateFrameLayerAllClipsStyles(
              pageIndex,
              layerIndex,
              { adjust: { ...adjust } }
            )
          }
        }
        stepsUtils.record()
      }
    }
  }

  clearCopiedFormat() {
    store.commit('SET_hasCopiedFormat', false)
    this.copiedFormat = undefined
  }
}

export default new FormatUtils()
