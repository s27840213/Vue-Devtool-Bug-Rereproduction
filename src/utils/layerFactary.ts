// import store from '@/store'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'

class LayerFactary {
  newImage(pageIndex: number, config: any): IImage {
    const basicConfig = {
      type: 'image',
      pageIndex: pageIndex,
      src: '',
      clipPath: '',
      active: false,
      shown: false,
      styles: {
        x: 0,
        y: 0,
        initX: 0,
        initY: 0,
        scale: 1,
        scaleX: 0,
        scaleY: 0,
        rotate: 0,
        width: 0,
        height: 0,
        initWidth: 0,
        initHeight: 0,
        zindex: -1
      }
    }
    Object.assign(basicConfig.styles, config.styles)
    return Object.assign(basicConfig, config)
  }

  newText(pageIndex: number, config: any): IImage {
    const basicConfig = {
      type: 'text',
      text: '',
      textEditable: false,
      pageIndex: pageIndex,
      active: false,
      shown: false,
      styles: {
        x: 0,
        y: 0,
        initX: 0,
        initY: 0,
        scale: 1,
        scaleX: 0,
        scaleY: 0,
        rotate: 0,
        width: 0,
        height: 0,
        initWidth: 0,
        initHeight: 0,
        zindex: -1,
        font: 'Lobster',
        weight: 'bold',
        align: 'left',
        lineHeight: 20,
        color: '#000000',
        size: 72,
        initSize: 72
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
        initX: styles.x,
        initY: styles.y,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        width: styles.width,
        height: styles.height,
        initWidth: styles.width,
        initHeight: styles.height,
        zindex: -1
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
        initX: styles.x,
        initY: styles.y,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        width: styles.width,
        height: styles.height,
        initWidth: styles.width,
        initHeight: styles.height,
        zindex: -1
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
      styles: {
        x: 0,
        y: 0,
        initX: 0,
        initY: 0,
        scale: 1,
        scaleX: 0,
        scaleY: 0,
        rotate: 0,
        width: 0,
        height: 0,
        initWidth: 0,
        initHeight: 0,
        zindex: -1
      }
    }
    return Object.assign(basicConfig, config)
  }
}

const layerFactary = new LayerFactary()

export default layerFactary
