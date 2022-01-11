import { ITextFormat, IImageFormat, IFormat, ITextEffect } from '@/interfaces/format'
import { IImage, IText } from '@/interfaces/layer'
import imageAdjustUtil from './imageAdjustUtil'

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
      textEffect: (text.styles.textEffect as ITextEffect | undefined) ?? { name: 'none' }
    }
  }

  extractImageFormat(image: any): IImageFormat {
    return image.styles.adjust ?? imageAdjustUtil.getDefaultProps()
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
    this.copiedFormat = format
    console.log(format)
  }
}

export default new FormatUtils()
