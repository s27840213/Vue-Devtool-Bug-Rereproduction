
import store from '@/store'
import { IShape, IText, IImage, IGroup, ITmp, IStyle, ILayer, IFrame } from '@/interfaces/layer'
import GroupUtils from '@/utils/groupUtils'
import mathUtils from './mathUtils'
import LayerUtils from '@/utils/layerUtils'
import { IPage } from '@/interfaces/page'
import { ICurrSelectedInfo } from '@/interfaces/editor'

class AlignUtils {
  get currSelectedInfo(): ICurrSelectedInfo {
    return store.getters.getCurrSelectedInfo
  }

  get currPage(): IPage {
    return store.getters.getPage(this.currSelectedInfo.pageIndex)
  }

  private getTmpAlignPos(tmpStyles: IStyle, layer: IShape | IText | IImage | IGroup | IFrame | ITmp, type: string): { [key: string]: number } {
    const bouding = mathUtils.getBounding(layer)
    const layerWidth = layer.styles.width
    const layerHeight = layer.styles.height
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
          x: (tmpStyles.width / 2) - (layerWidth / 2)
        }
      }
      case 'right': {
        return {
          x: tmpStyles.width - bouding.width + offset.x
        }
      }
      case 'top': {
        return {
          y: 0 + offset.y
        }
      }
      case 'centerVr': {
        return {
          y: (tmpStyles.height / 2) - (layerHeight / 2)
        }
      }
      case 'bottom': {
        return {
          y: tmpStyles.height - bouding.height + offset.y
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
      let tmpStyles = LayerUtils.getSelectedLayer().styles
      const rotateDeg = tmpStyles.rotate
      if (rotateDeg !== 0) {
        // Step 3 -> reselect layer to make align calculation much easier
        GroupUtils.reselect()
        tmpStyles = LayerUtils.getSelectedLayer().styles
      }
      // Step 4 -> align layers to target position, and then reselect to get the correct bounding rect.

      this.currSelectedInfo.layers.forEach((layer) => {
        Object.assign(layer.styles, this.getTmpAlignPos(tmpStyles, layer, type))
      })
      GroupUtils.reselect()
      if (rotateDeg !== 0) {
        // Step 5 -> rotated tmp layer with -N deg
        LayerUtils.updateLayerStyles(this.currSelectedInfo.pageIndex, this.currSelectedInfo.index, { rotate: -rotateDeg })
        const center1 = mathUtils.getCenter(LayerUtils.getSelectedLayer().styles)
        GroupUtils.reselect()
        // The center point of Step 6 and Step 7
        const center2 = mathUtils.getCenter(LayerUtils.getSelectedLayer().styles)
        // rotate the center 2 point around center1
        const center3 = mathUtils.getRotatedPoint(rotateDeg, center1, center2)
        console.log(center1, center2, center3)
        // and then get the center offset
        const centerOffset = {
          x: center3.x - center2.x,
          y: center3.y - center2.y
        }
        tmpStyles = LayerUtils.getSelectedLayer().styles
        LayerUtils.updateLayerStyles(this.currSelectedInfo.pageIndex, this.currSelectedInfo.index, {
          x: tmpStyles.x + centerOffset.x,
          y: tmpStyles.y + centerOffset.y,
          rotate: rotateDeg
        })
      }
    }
  }

  distribueHr(): void {
    let tmpStyles = LayerUtils.getSelectedLayer().styles
    const rotateDeg = tmpStyles.rotate
    if (rotateDeg !== 0) {
      GroupUtils.reselect()
      tmpStyles = LayerUtils.getSelectedLayer().styles
    }
    const totalWidth = tmpStyles.width
    const totalLayersWidth = this.currSelectedInfo.layers.reduce((acc: number, layer) => {
      return acc + layer.styles.width
    }, 0)
    const spacing = (totalWidth - totalLayersWidth) / (this.currSelectedInfo.layers.length - 1)
    // first sort the selected array accroding to x
    this.currSelectedInfo.layers.sort((a, b) => a.styles.x - b.styles.x)
    for (let i = 0; i < this.currSelectedInfo.layers.length; i++) {
      Object.assign(this.currSelectedInfo.layers[i].styles, {
        x: i === 0 ? 0 : this.currSelectedInfo.layers[i - 1].styles.x + this.currSelectedInfo.layers[i - 1].styles.width + spacing
      })
    }
    this.currSelectedInfo.layers.sort((a, b) => a.styles.zindex - b.styles.zindex)
  }

  distribueVr(): void {
    let tmpStyles = LayerUtils.getSelectedLayer().styles
    const rotateDeg = tmpStyles.rotate
    if (rotateDeg !== 0) {
      GroupUtils.reselect()
      tmpStyles = LayerUtils.getSelectedLayer().styles
    }
    const totalHeight = tmpStyles.height
    const totalLayersHeight = this.currSelectedInfo.layers.reduce((acc: number, layer) => {
      return acc + layer.styles.height
    }, 0)
    const spacing = (totalHeight - totalLayersHeight) / (this.currSelectedInfo.layers.length - 1)
    // first sort the selected array accroding to x
    this.currSelectedInfo.layers.sort((a, b) => a.styles.y - b.styles.y)
    for (let i = 0; i < this.currSelectedInfo.layers.length; i++) {
      Object.assign(this.currSelectedInfo.layers[i].styles, {
        y: i === 0 ? 0 : this.currSelectedInfo.layers[i - 1].styles.y + this.currSelectedInfo.layers[i - 1].styles.height + spacing
      })
    }
    this.currSelectedInfo.layers.sort((a, b) => a.styles.zindex - b.styles.zindex)
  }
}

const alignUtils = new AlignUtils()
export default alignUtils
