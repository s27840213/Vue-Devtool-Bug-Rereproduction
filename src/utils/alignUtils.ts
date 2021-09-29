
import store from '@/store'
import { IShape, IText, IImage, IGroup, ITmp, IStyle, ILayer } from '@/interfaces/layer'
import GroupUtils from '@/utils/groupUtils'
import mathUtils from './mathUtils'
import { IBounding } from '@/interfaces/math'
import LayerUtils from '@/utils/layerUtils'

class AlignUtils {
  leftAlign(): void {
    const currSelectedInfo = store.getters.getCurrSelectedInfo

    if (currSelectedInfo.layers.length === 1) {
      const layer = currSelectedInfo.layers[0] as ILayer
      const bouding = mathUtils.getBounding(layer)
      const offset = layer.styles.rotate === 0 ? 0 : layer.styles.x - bouding.x
      LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, {
        x: 0 + offset
      })
    } else {
      let tmpStyles = LayerUtils.getTmpLayer().styles
      const rotateDeg = tmpStyles.rotate
      if (rotateDeg !== 0) {
        GroupUtils.reselect()
        tmpStyles = LayerUtils.getTmpLayer().styles
      }
      const currSelectedInfo = store.getters.getCurrSelectedInfo
      currSelectedInfo.layers.forEach((layer: IShape | IText | IImage | IGroup | ITmp) => {
        const layerBounding = mathUtils.getBounding(layer)
        const offset: { [index: string]: number } = {
          x: layer.styles.x - layerBounding.x,
          y: layer.styles.y - layerBounding.y,
          width: layer.styles.width,
          height: layerBounding.height
        }
        Object.assign(layer.styles, this.getAlignPos(tmpStyles, layer.styles, offset, 'left'))
      })
      GroupUtils.reselect()
      if (rotateDeg !== 0) {
        // The formular we used here is record in the google doc Translation Calculation2
        // If you got some problem, just go to see that document. It's a little bit hard to understand
        LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, { rotate: -rotateDeg })
        const center1 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
        GroupUtils.reselect()
        const center2 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
        const center3 = mathUtils.getRotatedPoint(rotateDeg, center1, center2)
        const centerOffset = {
          x: center3.x - center2.x,
          y: center3.y - center2.y
        }
        tmpStyles = LayerUtils.getTmpLayer().styles
        LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, {
          x: tmpStyles.x + centerOffset.x,
          y: tmpStyles.y + centerOffset.y,
          rotate: rotateDeg
        })
      }
    }
  }

  centerHrAlign(): void {
    const currSelectedInfo = store.getters.getCurrSelectedInfo

    if (currSelectedInfo.layers.length === 1) {
      const pageWidth = store.getters.getPage(currSelectedInfo.pageIndex).width
      const layerWidth = currSelectedInfo.layers[0].styles.width
      LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, {
        x: (pageWidth / 2) - (layerWidth / 2)
      })
    } else {
      let tmpStyles = LayerUtils.getTmpLayer().styles
      const rotateDeg = tmpStyles.rotate
      if (rotateDeg !== 0) {
        GroupUtils.reselect()
        tmpStyles = LayerUtils.getTmpLayer().styles
      }
      const currSelectedInfo = store.getters.getCurrSelectedInfo
      currSelectedInfo.layers.forEach((layer: IShape | IText | IImage | IGroup | ITmp) => {
        Object.assign(layer.styles, this.getAlignPos(tmpStyles, layer.styles, {}, 'centerHr'))
      })
      GroupUtils.reselect()
      if (rotateDeg !== 0) {
        // The formular we used here is record in the google doc Translation Calculation2
        // If you got some problem, just go to see that document. It's a little bit hard to understand
        LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, { rotate: -rotateDeg })
        const center1 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
        GroupUtils.reselect()
        const center2 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
        const center3 = mathUtils.getRotatedPoint(rotateDeg, center1, center2)
        const centerOffset = {
          x: center3.x - center2.x,
          y: center3.y - center2.y
        }
        tmpStyles = LayerUtils.getTmpLayer().styles
        LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, {
          x: tmpStyles.x + centerOffset.x,
          y: tmpStyles.y + centerOffset.y,
          rotate: rotateDeg
        })
      }
    }
  }

  rightAlign(): void {
    const currSelectedInfo = store.getters.getCurrSelectedInfo

    if (currSelectedInfo.layers.length === 1) {
      const layer = currSelectedInfo.layers[0] as ILayer
      const bouding = mathUtils.getBounding(layer)
      const offset = layer.styles.rotate === 0 ? 0 : layer.styles.x - bouding.x
      const pageWidth = store.getters.getPage(currSelectedInfo.pageIndex).width
      LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, {
        x: pageWidth - bouding.width + offset
      })
    } else {
      let tmpStyles = LayerUtils.getTmpLayer().styles
      const rotateDeg = tmpStyles.rotate
      if (rotateDeg !== 0) {
        GroupUtils.reselect()
        tmpStyles = LayerUtils.getTmpLayer().styles
      }
      const currSelectedInfo = store.getters.getCurrSelectedInfo
      currSelectedInfo.layers.forEach((layer: IShape | IText | IImage | IGroup | ITmp) => {
        const layerBounding = mathUtils.getBounding(layer)
        const offset: { [index: string]: number } = {
          x: layer.styles.x - layerBounding.x,
          y: layer.styles.y - layerBounding.y,
          width: layerBounding.width,
          height: layerBounding.height
        }
        console.log(this.getAlignPos)
        Object.assign(layer.styles, this.getAlignPos(tmpStyles, layer.styles, offset, 'right'))
      })
      GroupUtils.reselect()
      if (rotateDeg !== 0) {
        // The formular we used here is record in the google doc Translation Calculation2
        // If you got some problem, just go to see that document. It's a little bit hard to understand
        LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, { rotate: -rotateDeg })
        const center1 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
        GroupUtils.reselect()
        const center2 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
        const center3 = mathUtils.getRotatedPoint(rotateDeg, center1, center2)
        const centerOffset = {
          x: center3.x - center2.x,
          y: center3.y - center2.y
        }
        tmpStyles = LayerUtils.getTmpLayer().styles
        LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, {
          x: tmpStyles.x + centerOffset.x,
          y: tmpStyles.y + centerOffset.y,
          rotate: rotateDeg
        })
      }
    }
  }

  topAlign(): void {
    const currSelectedInfo = store.getters.getCurrSelectedInfo

    if (currSelectedInfo.layers.length === 1) {
      const layer = currSelectedInfo.layers[0] as ILayer
      const bouding = mathUtils.getBounding(layer)
      const offset = layer.styles.rotate === 0 ? 0 : layer.styles.y - bouding.y
      LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, {
        y: 0 + offset
      })
    } else {
      let tmpStyles = LayerUtils.getTmpLayer().styles
      const rotateDeg = tmpStyles.rotate
      if (rotateDeg !== 0) {
        GroupUtils.reselect()
        tmpStyles = LayerUtils.getTmpLayer().styles
      }
      const currSelectedInfo = store.getters.getCurrSelectedInfo
      currSelectedInfo.layers.forEach((layer: IShape | IText | IImage | IGroup | ITmp) => {
        const layerBounding = mathUtils.getBounding(layer)
        const offset: { [index: string]: number } = {
          x: layer.styles.x - layerBounding.x,
          y: layer.styles.y - layerBounding.y,
          width: layer.styles.width - layerBounding.width,
          height: layer.styles.height - layerBounding.height
        }
        Object.assign(layer.styles, this.getAlignPos(tmpStyles, layer.styles, offset, 'top'))
      })

      GroupUtils.reselect()
      if (rotateDeg !== 0) {
        // The formular we used here is record in the google doc Translation Calculation2
        // If you got some problem, just go to see that document. It's a little bit hard to understand
        LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, { rotate: -rotateDeg })
        const center1 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
        GroupUtils.reselect()
        const center2 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
        const center3 = mathUtils.getRotatedPoint(rotateDeg, center1, center2)
        const centerOffset = {
          x: center3.x - center2.x,
          y: center3.y - center2.y
        }
        tmpStyles = LayerUtils.getTmpLayer().styles
        LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, {
          x: tmpStyles.x + centerOffset.x,
          y: tmpStyles.y + centerOffset.y,
          rotate: rotateDeg
        })
      }
    }
  }

  centerVrAlign(): void {
    const currSelectedInfo = store.getters.getCurrSelectedInfo

    if (currSelectedInfo.layers.length === 1) {
      const pageHeight = store.getters.getPage(currSelectedInfo.pageIndex).height
      const layerHeight = currSelectedInfo.layers[0].styles.height
      LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, {
        y: (pageHeight / 2) - (layerHeight / 2)
      })
    } else {
      let tmpStyles = LayerUtils.getTmpLayer().styles
      const rotateDeg = tmpStyles.rotate
      if (rotateDeg !== 0) {
        GroupUtils.reselect()
        tmpStyles = LayerUtils.getTmpLayer().styles
      }
      const currSelectedInfo = store.getters.getCurrSelectedInfo
      currSelectedInfo.layers.forEach((layer: IShape | IText | IImage | IGroup | ITmp) => {
        Object.assign(layer.styles, this.getAlignPos(tmpStyles, layer.styles, {}, 'centerVr'))
      })
      GroupUtils.reselect()
      if (rotateDeg !== 0) {
        // The formular we used here is record in the google doc Translation Calculation2
        // If you got some problem, just go to see that document. It's a little bit hard to understand
        LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, { rotate: -rotateDeg })
        const center1 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
        GroupUtils.reselect()
        const center2 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
        const center3 = mathUtils.getRotatedPoint(rotateDeg, center1, center2)
        const centerOffset = {
          x: center3.x - center2.x,
          y: center3.y - center2.y
        }
        tmpStyles = LayerUtils.getTmpLayer().styles
        LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, {
          x: tmpStyles.x + centerOffset.x,
          y: tmpStyles.y + centerOffset.y,
          rotate: rotateDeg
        })
      }
    }
  }

  bottomAlign(): void {
    const currSelectedInfo = store.getters.getCurrSelectedInfo

    if (currSelectedInfo.layers.length === 1) {
      const layer = currSelectedInfo.layers[0] as ILayer
      const bouding = mathUtils.getBounding(layer)
      const offset = layer.styles.rotate === 0 ? 0 : layer.styles.y - bouding.y
      const pageHeight = store.getters.getPage(currSelectedInfo.pageIndex).height
      LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, {
        y: pageHeight - bouding.height + offset
      })
    } else {
      let tmpStyles = LayerUtils.getTmpLayer().styles
      const rotateDeg = tmpStyles.rotate
      if (rotateDeg !== 0) {
        GroupUtils.reselect()
        tmpStyles = LayerUtils.getTmpLayer().styles
      }
      const currSelectedInfo = store.getters.getCurrSelectedInfo
      currSelectedInfo.layers.forEach((layer: IShape | IText | IImage | IGroup | ITmp) => {
        const layerBounding = mathUtils.getBounding(layer)
        const offset: { [index: string]: number } = {
          x: layer.styles.x - layerBounding.x,
          y: layer.styles.y - layerBounding.y,
          width: layerBounding.width,
          height: layerBounding.height
        }
        Object.assign(layer.styles, this.getAlignPos(tmpStyles, layer.styles, offset, 'bottom'))
      })
      GroupUtils.reselect()
      if (rotateDeg !== 0) {
        // The formular we used here is record in the google doc Translation Calculation2
        // If you got some problem, just go to see that document. It's a little bit hard to understand
        LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, { rotate: -rotateDeg })
        const center1 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
        GroupUtils.reselect()
        const center2 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
        const center3 = mathUtils.getRotatedPoint(rotateDeg, center1, center2)
        const centerOffset = {
          x: center3.x - center2.x,
          y: center3.y - center2.y
        }
        tmpStyles = LayerUtils.getTmpLayer().styles
        LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, {
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
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const totalWidth = tmpStyles.width
    const totalLayersWidth = currSelectedInfo.layers.reduce((acc: number, layer: IShape | IText | IImage | IGroup | ITmp) => {
      return acc + layer.styles.width
    }, 0)
    const spacing = (totalWidth - totalLayersWidth) / (currSelectedInfo.layers.length - 1)
    // first sort the selected array accroding to x
    currSelectedInfo.layers.sort((a: IShape | IText | IImage | IGroup | ITmp, b: IShape | IText | IImage | IGroup | ITmp) => a.styles.x - b.styles.x)
    for (let i = 0; i < currSelectedInfo.layers.length; i++) {
      Object.assign(currSelectedInfo.layers[i].styles, {
        x: i === 0 ? 0 : currSelectedInfo.layers[i - 1].styles.x + currSelectedInfo.layers[i - 1].styles.width + spacing
      })
    }
    currSelectedInfo.layers.sort((a: IShape | IText | IImage | IGroup | ITmp, b: IShape | IText | IImage | IGroup | ITmp) => a.styles.zindex - b.styles.zindex)
  }

  distribueVr(): void {
    let tmpStyles = LayerUtils.getTmpLayer().styles
    const rotateDeg = tmpStyles.rotate
    if (rotateDeg !== 0) {
      GroupUtils.reselect()
      tmpStyles = LayerUtils.getTmpLayer().styles
    }
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const totalHeight = tmpStyles.height
    const totalLayersHeight = currSelectedInfo.layers.reduce((acc: number, layer: IShape | IText | IImage | IGroup | ITmp) => {
      return acc + layer.styles.height
    }, 0)
    const spacing = (totalHeight - totalLayersHeight) / (currSelectedInfo.layers.length - 1)
    // first sort the selected array accroding to x
    currSelectedInfo.layers.sort((a: IShape | IText | IImage | IGroup | ITmp, b: IShape | IText | IImage | IGroup | ITmp) => a.styles.y - b.styles.y)
    for (let i = 0; i < currSelectedInfo.layers.length; i++) {
      Object.assign(currSelectedInfo.layers[i].styles, {
        y: i === 0 ? 0 : currSelectedInfo.layers[i - 1].styles.y + currSelectedInfo.layers[i - 1].styles.height + spacing
      })
    }
    currSelectedInfo.layers.sort((a: IShape | IText | IImage | IGroup | ITmp, b: IShape | IText | IImage | IGroup | ITmp) => a.styles.zindex - b.styles.zindex)
  }

  getAlignPos(tmpStyles: IStyle, layerStyles: IStyle, offset: { [index: string]: number }, type: string): { [key: string]: number } {
    switch (type) {
      case 'left': {
        return {
          x: 0 + offset.x
        }
      }
      case 'centerHr': {
        return {
          x: (tmpStyles.initWidth / 2) - (layerStyles.width / 2)
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
          y: (tmpStyles.initHeight / 2) - (layerStyles.height / 2)
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
}

const alignUtils = new AlignUtils()
export default alignUtils
