// import store from '@/store'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'

class LayerFactary {
  newImage(pageIndex: number, config: any): IImage {
    const [width, height] = [config.styles.width, config.styles.height]
    const basicConfig = {
      type: 'image',
      pageIndex: pageIndex,
      src: '',
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

  newText(pageIndex: number, config: any): IImage {
    const basicConfig = {
      type: 'text',
      text: '',
      widthLimit: '',
      textEditable: false,
      pageIndex: pageIndex,
      active: false,
      shown: false,
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
        weight: 'bold',
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

  newGroup(pageIndex: number, styles: ICalculatedGroupStyle, layers: Array<IShape | IText | IImage | IGroup>): IGroup {
    return {
      pageIndex: pageIndex,
      type: 'group',
      active: false,
      shown: false,
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

  newTmp(pageIndex: number, styles: ICalculatedGroupStyle, layers: Array<IShape | IText | IImage | IGroup>) {
    return {
      pageIndex: pageIndex,
      type: 'tmp',
      active: true,
      shown: false,
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

  newShape(pageIndex: number, config: any): IImage {
    const basicConfig = {
      type: 'shape',
      pageIndex: pageIndex,
      active: false,
      shown: false,
      path: '',
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
