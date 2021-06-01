// import store from '@/store'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'

class LayerFactary {
  newImage(config: IImage): IImage {
    const [width, height] = [config.styles.width, config.styles.height]
    const basicConfig = {
      type: 'image',
      src: 'none',
      clipPath: `path('M0 0 L0 ${height} ${width} ${height} ${width} 0Z')`,
      active: false,
      shown: false,
      imgControl: false,
      isClipped: false,
      styles: {
        x: 0,
        y: 0,
        scale: 1,
        scaleX: 0,
        scaleY: 0,
        rotate: 0,
        width: 0,
        height: 0,
        initWidth: 0,
        initHeight: 0,
        imgX: 0,
        imgY: 0,
        imgWidth: config.styles.initWidth,
        imgHeight: config.styles.initHeight,
        zindex: -1,
        opacity: 100
      }
    }
    Object.assign(basicConfig.styles, config.styles)
    return Object.assign(basicConfig, config)
  }

  newText(config: any): IText {
    const basicConfig = {
      type: 'text',
      text: '',
      widthLimit: '',
      textEditable: false,
      active: false,
      shown: false,
      locked: false,
      styles: {
        x: 0,
        y: 0,
        scale: 1,
        scaleX: 0,
        scaleY: 0,
        rotate: 0,
        width: 0,
        height: 0,
        initWidth: 0,
        initHeight: 0,
        zindex: -1,
        opacity: 100,
        font: 'Lobster',
        weight: 'normal',
        align: 'left',
        lineHeight: 20,
        color: '#000000',
        size: 72,
        initSize: 72,
        writingMode: 'initial',
        decoration: 'none',
        style: 'normal'
      }
    }
    Object.assign(basicConfig.styles, config.styles)
    return Object.assign(basicConfig, config)
  }

  newGroup(styles: ICalculatedGroupStyle, layers: Array<IShape | IText | IImage | IGroup>): IGroup {
    return {
      type: 'group',
      active: false,
      shown: false,
      locked: false,
      styles: {
        x: styles.x,
        y: styles.y,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        width: styles.width,
        height: styles.height,
        initWidth: styles.width,
        initHeight: styles.height,
        zindex: -1,
        opacity: 100
      },
      layers: layers
    }
  }

  newTmp(styles: ICalculatedGroupStyle, layers: Array<IShape | IText | IImage | IGroup>) {
    return {
      type: 'tmp',
      active: true,
      shown: false,
      locked: false,
      styles: {
        x: styles.x,
        y: styles.y,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        width: styles.width,
        height: styles.height,
        initWidth: styles.width,
        initHeight: styles.height,
        zindex: 0,
        opacity: 100
      },
      layers: layers
    }
  }

  newShape(config: IShape): IShape {
    const basicConfig = {
      type: 'shape',
      active: false,
      shown: false,
      path: '',
      locked: false,
      styles: {
        x: 0,
        y: 0,
        scale: 1,
        scaleX: 0,
        scaleY: 0,
        rotate: 0,
        width: 0,
        height: 0,
        initWidth: 0,
        initHeight: 0,
        zindex: -1,
        opacity: 100
      }
    }
    return Object.assign(basicConfig, config)
  }
}

const layerFactary = new LayerFactary()

export default layerFactary
