import { ITextFormat, IImageFormat, IFormat } from '@/interfaces/format'
import { IImage, IText } from '@/interfaces/layer'

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
    this.copiedFormat = format
  }
}

export default new FormatUtils()
