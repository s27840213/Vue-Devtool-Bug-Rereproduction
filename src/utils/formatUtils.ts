import store from '@/store'
import { ITextFormat, IImageFormat, IFormat } from '@/interfaces/format'
import { IGroup, IImage, IParagraph, IText } from '@/interfaces/layer'
import generalUtils from './generalUtils'
import tiptapUtils from './tiptapUtils'
import layerUtils from './layerUtils'
import textUtils from './textUtils'
import controlUtils from './controlUtils'
import stepsUtils from './stepsUtils'

class FormatUtils {
  copiedFormat: IFormat | undefined

  extractTextFormat(text: IText): ITextFormat {
    const paragraphs = text.paragraphs
    const lastParagraph = paragraphs[paragraphs.length - 1]
    const spans = lastParagraph.spans
    const lastSpan = spans[spans.length - 1]
    return {
      paragraphStyle: lastParagraph.styles,
      spanStyle: lastSpan.styles,
      scale: text.styles.scale,
      textEffect: (text as any).styles.textEffect,
      textShape: (text as any).styles.textShape
    }
  }

  extractImageFormat(image: any): IImageFormat {
    return image.styles.adjust
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

  applyFormatIfCopied(pageIndex: number, layerIndex: number, subLayerIndex = -1) {
    if (!this.copiedFormat) return
    const type = this.copiedFormat.type
    const layer = store.getters.getLayer(pageIndex, layerIndex)
    if (subLayerIndex >= 0) { // subController
      const subLayer = (layer as IGroup).layers[subLayerIndex]
      if (subLayer.type !== type) return
      console.log('NOT IMPLEMENT YET!')
    } else { // controller
      if (layer.type !== type) return // TODO: handle group as well
      if (type === 'text') {
        const { paragraphStyle, spanStyle, scale, textEffect, textShape } = this.copiedFormat.content as ITextFormat
        const paragraphs = generalUtils.deepCopy(layer.paragraphs) as IParagraph[]
        for (const paragraph of paragraphs) {
          paragraph.styles = paragraphStyle
          if (paragraph.spanStyle) {
            paragraph.spanStyle = tiptapUtils.textStyles(spanStyle)
          }
          for (const span of paragraph.spans) {
            span.styles = spanStyle
          }
        }
        layerUtils.updateLayerProps(pageIndex, layerIndex, { paragraphs })
        layerUtils.updateLayerStyles(pageIndex, layerIndex, { scale })
        layerUtils.updateSpecLayerData({
          pageIndex,
          layerIndex,
          styles: { textEffect, textShape }
        })
        if (Object.keys(textShape).length === 0) {
          const text = store.getters.getLayer(pageIndex, layerIndex)
          const newSize = textUtils.getTextHW(text, text.styles.widthLimit)
          controlUtils.updateLayerSize(pageIndex, layerIndex, newSize.width, newSize.height, text.styles.scale)
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
