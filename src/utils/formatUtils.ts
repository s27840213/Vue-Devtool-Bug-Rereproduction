import store from '@/store'
import { ITextFormat, IImageFormat, IFormat } from '@/interfaces/format'
import { IGroup, IImage, ILayer, IParagraph, IText } from '@/interfaces/layer'
import generalUtils from './generalUtils'
import tiptapUtils from './tiptapUtils'
import layerUtils from './layerUtils'
import textUtils from './textUtils'
import controlUtils from './controlUtils'
import stepsUtils from './stepsUtils'
import imageAdjustUtil from './imageAdjustUtil'
import frameUtils from './frameUtils'
import textShapeUtils from './textShapeUtils'
import mathUtils from './mathUtils'

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
        for (const targetLayerIndex in layers) {
          const idx = subLayerIndex >= 0 ? subLayerIndex : +targetLayerIndex
          const targetLayer = layers[targetLayerIndex]
          if (targetLayer.type !== 'text') continue
          const targetTextLayer = targetLayer as any
          const wasCurveText = this.isCurveText(targetTextLayer.styles.textShape ?? {})
          const bendOri = targetTextLayer.styles.textShape?.bend
          let hDiff1 = 0
          let minHeight = targetTextLayer.styles.height
          if (wasCurveText) {
            minHeight = textShapeUtils.getCurveTextHW(targetTextLayer).minHeight
            const height = targetTextLayer.styles.height
            hDiff1 = bendOri < 0 ? (height - minHeight) / 2 : (minHeight - height) / 2
          }
          const paragraphs = this.applyTextStyles(targetTextLayer.paragraphs)
          layerUtils.updateSpecLayerData({
            pageIndex,
            layerIndex,
            subLayerIndex: idx,
            type: ['text'],
            styles: {
              textEffect: { ...textEffect },
              textShape: { ...textShape },
              scale
            },
            props: { paragraphs }
          })
          if (this.isCurveText(textShape)) {
            const textProps = textShapeUtils.getCurveTextProps(targetTextLayer)
            if (wasCurveText) {
              const { x, y, width, height, rotate } = targetTextLayer.styles
              const bend = +targetTextLayer.styles.textShape?.bend
              const hDiff2 = bend < 0 ? (minHeight - textProps.height) / 2 : (textProps.height - minHeight) / 2
              Object.assign(textProps, {
                x: x + width / 2 - (hDiff1 + hDiff2) * mathUtils.sin(rotate) - (textProps.width / 2),
                y: y + height / 2 + (hDiff1 + hDiff2) * mathUtils.cos(rotate) - (textProps.height / 2)
              })
            }
            layerUtils.updateSubLayerStyles(
              pageIndex,
              layerIndex,
              idx,
              textProps
            )
            layerUtils.updateSubLayerProps(
              pageIndex,
              layerIndex,
              idx,
              { widthLimit: -1 }
            )
          } else {
            const textHW = textUtils.getTextHW(targetTextLayer, targetTextLayer.styles.widthLimit)
            let hDiff2
            const { width, height, rotate } = targetTextLayer.styles
            if (wasCurveText) {
              hDiff2 = +bendOri < 0 ? (minHeight - textHW.height) / 2 : (textHW.height - minHeight) / 2
            } else {
              hDiff2 = (textHW.height - minHeight) / 2
            }
            layerUtils.updateSubLayerStyles(
              pageIndex,
              layerIndex,
              idx,
              {
                ...textHW,
                x: targetTextLayer.styles.x + width / 2 - (hDiff1 + hDiff2) * mathUtils.sin(rotate) - (textHW.width / 2),
                y: targetTextLayer.styles.y + height / 2 + (hDiff1 + hDiff2) * mathUtils.cos(rotate) - (textHW.height / 2)
              }
            )
          }
        }
        textUtils.updateGroupLayerSize(pageIndex, layerIndex)
        textUtils.fixGroupCoordinates(pageIndex, layerIndex)
        stepsUtils.record()
      }
      if (type === 'image') {
        const adjust = this.copiedFormat.content as IImageFormat
        if (isSubController) {
          if (layers[0].type === 'frame') {
            frameUtils.updateSubFrameLayerAllClipsStyles(
              pageIndex,
              layerIndex,
              subLayerIndex,
              { adjust: { ...adjust } }
            )
          }
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
        const wasCurveText = this.isCurveText(layer.styles.textShape ?? {})
        const bendOri = layer.styles.textShape?.bend
        let hDiff1 = 0
        let minHeight = layer.styles.height
        if (wasCurveText) {
          minHeight = textShapeUtils.getCurveTextHW(layer).minHeight
          const height = layer.styles.height
          hDiff1 = bendOri < 0 ? (height - minHeight) / 2 : (minHeight - height) / 2
        }
        const { scale, textEffect, textShape } = this.copiedFormat.content as ITextFormat
        const paragraphs = this.applyTextStyles(layer.paragraphs)
        layerUtils.updateSpecLayerData({
          pageIndex,
          layerIndex,
          styles: {
            textEffect: { ...textEffect },
            textShape: { ...textShape },
            scale
          },
          props: { paragraphs }
        })
        const text = store.getters.getLayer(pageIndex, layerIndex)
        if (this.isCurveText(textShape)) {
          const textProps = textShapeUtils.getCurveTextProps(text)
          if (wasCurveText) {
            const { x, y, width, height, rotate } = text.styles
            const bend = +text.styles.textShape?.bend
            const hDiff2 = bend < 0 ? (minHeight - textProps.height) / 2 : (textProps.height - minHeight) / 2
            Object.assign(textProps, {
              x: x + width / 2 - (hDiff1 + hDiff2) * mathUtils.sin(rotate) - (textProps.width / 2),
              y: y + height / 2 + (hDiff1 + hDiff2) * mathUtils.cos(rotate) - (textProps.height / 2)
            })
          }
          layerUtils.updateLayerStyles(pageIndex, layerIndex, textProps)
          layerUtils.updateLayerProps(pageIndex, layerIndex, { widthLimit: -1 })
        } else {
          const textHW = textUtils.getTextHW(text, text.styles.widthLimit)
          const { width, height, rotate } = text.styles
          let hDiff2
          if (wasCurveText) {
            hDiff2 = +bendOri < 0 ? (minHeight - textHW.height) / 2 : (textHW.height - minHeight) / 2
          } else {
            hDiff2 = (textHW.height - minHeight) / 2
          }
          layerUtils.updateLayerStyles(pageIndex, layerIndex, {
            ...textHW,
            x: text.styles.x + width / 2 - (hDiff1 + hDiff2) * mathUtils.sin(rotate) - (textHW.width / 2),
            y: text.styles.y + height / 2 + (hDiff1 + hDiff2) * mathUtils.cos(rotate) - (textHW.height / 2)
          })
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
