import ControlUtils from '@/utils/controlUtils'
import store from '@/store'
import { IText } from '@/interfaces/layer'
import CssConveter from '@/utils/cssConverter'

class TextUtils {
  get pageIndex(): number { return store.getters.getLastSelectedPageIndex }
  get layerIndex(): number { return store.getters.getCurrSelectedIndex }
  get getCurrLayer(): IText { return store.getters.getLayer(this.pageIndex, this.layerIndex) }

  onPropertyClick(iconName: string) {
    if (iconName.substring(0, 10) === 'text-align') {
      this.textAlign(iconName)
    } else if (iconName === 'bold') {
      this.textBold()
    } else if (iconName === 'underline') {
      this.textUnderline()
    } else if (iconName === 'italic') {
      this.textItalic()
    } else if (iconName === 'font-vertical') {
      this.textVertical()
    }
  }

  textAlign(iconName: string) {
    const align = iconName.substring(11, iconName.length)
    this.updateTextStyles(this.pageIndex, this.layerIndex, { align })
  }

  textBold() {
    let weight = 'normal'
    if (this.getCurrLayer.styles.weight === 'normal') {
      weight = 'bold'
    }
    this.updateTextStyles(this.pageIndex, this.layerIndex, { weight })
  }

  textUnderline() {
    let decoration = 'none'
    if (this.getCurrLayer.styles.decoration === 'none') {
      decoration = 'underline'
    }
    this.updateTextStyles(this.pageIndex, this.layerIndex, { decoration })
  }

  textItalic() {
    let style = 'normal'
    if (this.getCurrLayer.styles.style === 'normal') {
      style = 'italic'
    }
    this.updateTextStyles(this.pageIndex, this.layerIndex, { style })
  }

  textVertical() {
    let writingMode = 'initial'
    const layer = this.getCurrLayer
    if (layer.styles.writingMode === 'initial') {
      writingMode = 'vertical-lr'
    }

    const textSize = {
      width: layer.styles.height,
      height: layer.styles.width
    }
    ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, layer.styles.size as number)
    ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, 1)
    this.updateTextStyles(this.pageIndex, this.layerIndex, { writingMode })
  }

  fontSizeStepping(step: number) {
    let size = this.getCurrLayer.styles.size
    if (size) {
      if (typeof size === 'string') {
        size = parseInt(size) + step
      } else if (typeof size === 'number') {
        size += step
      }
      this.updateTextStyles(this.pageIndex, this.layerIndex, { size })
    }
    this.updateLayerSize()
  }

  updateLayerSize() {
    const textHW = this.getTextHW(this.getCurrLayer.text, this.getCurrLayer.styles)
    ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, this.getCurrLayer.styles.size)
    ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, 1)
  }

  getTextHW(text: string, styles: any, width = `${this.getCurrLayer.widthLimit as number}px`) {
    const el = document.createElement('span')
    el.style.whiteSpace = 'pre-wrap'
    el.style.display = 'inline-block'
    el.style.overflowWrap = 'break-word'
    el.style.width = width
    el.innerHTML = text
    Object.assign(el.style, CssConveter.convertFontStyle(styles))
    document.body.appendChild(el)
    const textHW = {
      width: Math.ceil(el.getBoundingClientRect().width),
      height: Math.ceil(el.getBoundingClientRect().height)
    }
    document.body.removeChild(el)
    return textHW
  }

  updateTextStyles(pageIndex: number, layerIndex: number, styles: { [key: string]: string | number }) {
    store.commit('UPDATE_layerStyles', ({
      pageIndex,
      layerIndex,
      styles
    }))
  }
}

export default new TextUtils()
