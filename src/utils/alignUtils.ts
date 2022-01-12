
import store from '@/store'
import { IShape, IText, IImage, IGroup, ITmp, IStyle, ILayer } from '@/interfaces/layer'
import GroupUtils from '@/utils/groupUtils'
import mathUtils from './mathUtils'
import { IBounding } from '@/interfaces/math'
import LayerUtils from '@/utils/layerUtils'
import { IPage } from '@/interfaces/page'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import themeUtils from './themeUtils'

class AlignUtils {
  get currSelectedInfo(): ICurrSelectedInfo {
    return store.getters.getCurrSelectedInfo
  }

  get currPage(): IPage {
    return store.getters.getPage(this.currSelectedInfo.pageIndex)
  }

  private getTmpAlignPos(tmpStyles: IStyle, layer: IShape | IText | IImage | IGroup | ITmp, type: string): { [key: string]: number } {
    const layerBounding = mathUtils.getBounding(layer)
    const offset: { [index: string]: number } = {
      x: layer.styles.x - layerBounding.x,
      y: layer.styles.y - layerBounding.y,
      width: layerBounding.width,
      height: layerBounding.height
    }
    switch (type) {
      case 'left': {
        return {
          x: 0 + offset.x
        }
      }
      case 'centerHr': {
        return {
          x: (tmpStyles.initWidth / 2) - (layer.styles.width / 2)
        }
      }
      case 'right': {
        return {
          x: tmpStyles.initWidth - offset.width + offset.x
        }
      }
      case 'top': {
        return {
          y: 0 + offset.y
        }
      }
      case 'centerVr': {
        return {
          y: (tmpStyles.initHeight / 2) - (layer.styles.height / 2)
        }
      }
      case 'bottom': {
        return {
          y: tmpStyles.initHeight - offset.height + offset.y
        }
      }
      default: {
        return {}
      }
    }
  }

  private getPageAlignPos(type: string): { [key: string]: number } {
    const layer = this.currSelectedInfo.layers[0] as ILayer
    const bouding = mathUtils.getBounding(layer)
    const layerWidth = layer.styles.width
    const layerHeight = layer.styles.height
    const pageWidth = this.currPage.width
    const pageHeight = this.currPage.height
    const offset = layer.styles.rotate === 0 ? { x: 0, y: 0 } : {
      x: layer.styles.x - bouding.x,
      y: layer.styles.y - bouding.y
    }
    switch (type) {
      case 'left': {
        return {
          x: 0 + offset.x
        }
      }
      case 'centerHr': {
        return {
          x: (pageWidth / 2) - (layerWidth / 2)
        }
      }
      case 'right': {
        return {
          x: pageWidth - bouding.width + offset.x
        }
      }
      case 'top': {
        return {
          y: 0 + offset.y
        }
      }
      case 'centerVr': {
        return {
          y: (pageHeight / 2) - (layerHeight / 2)
        }
      }
      case 'bottom': {
        return {
          y: pageHeight - bouding.height + offset.y
        }
      }
      default: {
        return {}
      }
    }
  }

  align(type: string) {
    const { layers, pageIndex, index } = this.currSelectedInfo
    if (layers.length === 1) {
      const pageAlignPos = this.getPageAlignPos(type)
      LayerUtils.updateLayerStyles(pageIndex, index, pageAlignPos)
    } else {
      let tmpStyles = LayerUtils.getTmpLayer().styles
      const rotateDeg = tmpStyles.rotate
      if (rotateDeg !== 0) {
        GroupUtils.reselect()
        tmpStyles = LayerUtils.getTmpLayer().styles
      }
      layers.forEach((layer: IShape | IText | IImage | IGroup | ITmp) => {
        Object.assign(layer.styles, this.getTmpAlignPos(tmpStyles, layer, type))
      })
      GroupUtils.reselect()
      if (rotateDeg !== 0) {
        // The formular we used here is record in the google doc Translation Calculation2
        // If you got some problem, just go to see that document. It's a little bit hard to understand
        LayerUtils.updateLayerStyles(this.currSelectedInfo.pageIndex, this.currSelectedInfo.index, { rotate: -rotateDeg })
        const center1 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
        GroupUtils.reselect()
        const center2 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
        const center3 = mathUtils.getRotatedPoint(rotateDeg, center1, center2)
        const centerOffset = {
          x: center3.x - center2.x,
          y: center3.y - center2.y
        }
        tmpStyles = LayerUtils.getTmpLayer().styles
        LayerUtils.updateLayerStyles(this.currSelectedInfo.pageIndex, this.currSelectedInfo.index, {
          x: tmpStyles.x + centerOffset.x,
          y: tmpStyles.y + centerOffset.y,
          rotate: rotateDeg
        })
      }
    }
  }

  distribueHr(): void {
    let tmpStyles = LayerUtils.getTmpLayer().styles
    const rotateDeg = tmpStyles.rotate
    if (rotateDeg !== 0) {
      GroupUtils.reselect()
      tmpStyles = LayerUtils.getTmpLayer().styles
    }
    const totalWidth = tmpStyles.width
    const totalLayersWidth = this.currSelectedInfo.layers.reduce((acc: number, layer: IShape | IText | IImage | IGroup | ITmp) => {
      return acc + layer.styles.width
    }, 0)
    const spacing = (totalWidth - totalLayersWidth) / (this.currSelectedInfo.layers.length - 1)
    // first sort the selected array accroding to x
    this.currSelectedInfo.layers.sort((a: IShape | IText | IImage | IGroup | ITmp, b: IShape | IText | IImage | IGroup | ITmp) => a.styles.x - b.styles.x)
    for (let i = 0; i < this.currSelectedInfo.layers.length; i++) {
      Object.assign(this.currSelectedInfo.layers[i].styles, {
        x: i === 0 ? 0 : this.currSelectedInfo.layers[i - 1].styles.x + this.currSelectedInfo.layers[i - 1].styles.width + spacing
      })
    }
    this.currSelectedInfo.layers.sort((a: IShape | IText | IImage | IGroup | ITmp, b: IShape | IText | IImage | IGroup | ITmp) => a.styles.zindex - b.styles.zindex)
  }

  distribueVr(): void {
    let tmpStyles = LayerUtils.getTmpLayer().styles
    const rotateDeg = tmpStyles.rotate
    if (rotateDeg !== 0) {
      GroupUtils.reselect()
      tmpStyles = LayerUtils.getTmpLayer().styles
    }
    const totalHeight = tmpStyles.height
    const totalLayersHeight = this.currSelectedInfo.layers.reduce((acc: number, layer: IShape | IText | IImage | IGroup | ITmp) => {
      return acc + layer.styles.height
    }, 0)
    const spacing = (totalHeight - totalLayersHeight) / (this.currSelectedInfo.layers.length - 1)
    // first sort the selected array accroding to x
    this.currSelectedInfo.layers.sort((a: IShape | IText | IImage | IGroup | ITmp, b: IShape | IText | IImage | IGroup | ITmp) => a.styles.y - b.styles.y)
    for (let i = 0; i < this.currSelectedInfo.layers.length; i++) {
      Object.assign(this.currSelectedInfo.layers[i].styles, {
        y: i === 0 ? 0 : this.currSelectedInfo.layers[i - 1].styles.y + this.currSelectedInfo.layers[i - 1].styles.height + spacing
      })
    }
    this.currSelectedInfo.layers.sort((a: IShape | IText | IImage | IGroup | ITmp, b: IShape | IText | IImage | IGroup | ITmp) => a.styles.zindex - b.styles.zindex)
  }
}

const alignUtils = new AlignUtils()
export default alignUtils
