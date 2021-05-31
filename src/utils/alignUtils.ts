
import store from '@/store'
import { IShape, IText, IImage, IGroup, ITmp, IStyle, ILayer } from '@/interfaces/layer'
import GroupUtils from '@/utils/groupUtils'
import mathUtils from './mathUtils'
import { IBounding } from '@/interfaces/math'
import LayerUtils from '@/utils/layerUtils'

class AlignUtils {
  leftAlign(): void {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    if (currSelectedInfo.layers.length === 1) {
      const layer = currSelectedInfo.layers[0] as ILayer
      const bouding = mathUtils.getBounding(layer)
      const offset = layer.styles.rotate === 0 ? 0 : layer.styles.x - bouding.x
      LayerUtils.updateLayerStyles(lastSelectedPageIndex, currSelectedInfo.index, {
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
      // if (rotateDeg !== 0) {
      //   LayerUtils.updateLayerStyles(lastSelectedPageIndex, currSelectedInfo.index, { rotate: -rotateDeg })
      //   const center1 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
      //   GroupUtils.reselect()
      //   const center2 = mathUtils.getCenter(LayerUtils.getTmpLayer().styles)
      //   const centerOffset = {
      //     x: center1.x - center2.x,
      //     y: center1.y - center2.y
      //   }
      //   LayerUtils.updateLayerStyles(lastSelectedPageIndex, currSelectedInfo.index, {
      //     x: tmpStyles.x + centerOffset.x,
      //     y: tmpStyles.y + centerOffset.y,
      //     rotate: rotateDeg
      //   })
      // }
    }
  }

  centerHrAlign(): void {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    if (currSelectedInfo.layers.length === 1) {
      const pageWidth = store.getters.getPage(lastSelectedPageIndex).width
      const layerWidth = currSelectedInfo.layers[0].styles.width
      LayerUtils.updateLayerStyles(lastSelectedPageIndex, currSelectedInfo.index, {
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
    }
  }

  rightAlign(): void {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    if (currSelectedInfo.layers.length === 1) {
      const layer = currSelectedInfo.layers[0] as ILayer
      const bouding = mathUtils.getBounding(layer)
      const offset = layer.styles.rotate === 0 ? 0 : layer.styles.x - bouding.x
      const pageWidth = store.getters.getPage(lastSelectedPageIndex).width
      LayerUtils.updateLayerStyles(lastSelectedPageIndex, currSelectedInfo.index, {
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
        Object.assign(layer.styles, this.getAlignPos(tmpStyles, layer.styles, offset, 'right'))
      })
      GroupUtils.reselect()
    }
  }

  topAlign(): void {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    if (currSelectedInfo.layers.length === 1) {
      const layer = currSelectedInfo.layers[0] as ILayer
      const bouding = mathUtils.getBounding(layer)
      const offset = layer.styles.rotate === 0 ? 0 : layer.styles.y - bouding.y
      LayerUtils.updateLayerStyles(lastSelectedPageIndex, currSelectedInfo.index, {
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
    }
  }

  centerVrAlign(): void {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    if (currSelectedInfo.layers.length === 1) {
      const pageHeight = store.getters.getPage(lastSelectedPageIndex).height
      const layerHeight = currSelectedInfo.layers[0].styles.height
      console.log(pageHeight, layerHeight)
      LayerUtils.updateLayerStyles(lastSelectedPageIndex, currSelectedInfo.index, {
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
    }
  }

  bottomAlign(): void {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    if (currSelectedInfo.layers.length === 1) {
      const layer = currSelectedInfo.layers[0] as ILayer
      const bouding = mathUtils.getBounding(layer)
      const offset = layer.styles.rotate === 0 ? 0 : layer.styles.y - bouding.y
      const pageHeight = store.getters.getPage(lastSelectedPageIndex).height
      LayerUtils.updateLayerStyles(lastSelectedPageIndex, currSelectedInfo.index, {
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
    }
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
