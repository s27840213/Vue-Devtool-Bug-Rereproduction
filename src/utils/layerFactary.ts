import { ICalculatedGroupStyle } from '@/interfaces/group'
import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'
import GeneralUtils from '@/utils/generalUtils'
class LayerFactary {
  newImage(config: any): IImage {
    const { width, height } = config.styles
    const basicConfig = {
      type: 'image',
      // srcObj: {
      //   tpye: config.srcObj.type,
      //   userId: config.srcObj.userId,
      //   assetId: config.srcObj.assetId
      // },
      src: '',
      id: GeneralUtils.generateRandomString(8),
      clipPath: `path('M0 0 L0 ${height} ${width} ${height} ${width} 0Z')`,
      active: false,
      shown: false,
      locked: false,
      moved: false,
      imgControl: false,
      isClipper: false,
      dragging: false,
      designId: '',
      styles: {
        x: 0,
        y: 0,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
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
    delete config.styles
    return Object.assign(basicConfig, config)
  }

  newText(config: any): IText {
    const basicConfig = {
      type: 'text',
      id: GeneralUtils.generateRandomString(8),
      widthLimit: -1,
      isTyping: false,
      active: false,
      shown: false,
      locked: false,
      moved: false,
      dragging: false,
      designId: '',
      editing: false,
      styles: {
        x: 0,
        y: 0,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        width: config.styles.width ? config.styles.width : 0,
        height: config.styles.width ? config.styles.width : 0,
        initWidth: config.styles.width ? config.styles.width : 0,
        initHeight: config.styles.height ? config.styles.height : 0,
        zindex: -1,
        writingMode: 'initial',
        align: 'left'
      },
      paragraphs: [
        {
          styles: {
            fontSpacing: 0,
            lineHeight: -1
          },
          spans: [
            {
              text: '',
              styles: {
                opacity: 1,
                font: 'normal',
                weight: 'normal',
                color: '#000000',
                size: 72,
                decoration: 'none',
                style: 'normal'
              }
            }
          ]
        }
      ]
    }
    Object.assign(basicConfig.styles, config.styles)
    delete config.styles
    return Object.assign(basicConfig, config)
  }

  newGroup(styles: ICalculatedGroupStyle, layers: Array<IShape | IText | IImage | IGroup>): IGroup {
    return {
      type: 'group',
      id: GeneralUtils.generateRandomString(8),
      active: false,
      shown: false,
      locked: false,
      moved: false,
      dragging: false,
      designId: '',
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
      id: GeneralUtils.generateRandomString(8),
      active: true,
      shown: false,
      locked: false,
      moved: false,
      dragging: false,
      designId: '',
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

  newShape(config: any): IShape {
    const basicConfig = {
      type: 'shape',
      id: GeneralUtils.generateRandomString(8),
      active: false,
      shown: false,
      path: '',
      color: [],
      size: [],
      svg: '',
      vSize: [0, 0],
      cSize: [0, 0],
      pSize: [0, 0],
      pDiff: [0, 0],
      ratio: 1,
      category: '',
      className: '',
      locked: false,
      moved: false,
      dragging: false,
      designId: '',
      styles: {
        x: 0,
        y: 0,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        width: 0,
        height: 0,
        initWidth: 0,
        initHeight: 0,
        zindex: -1,
        opacity: 100
      }
    }
    Object.assign(basicConfig.styles, config.styles)
    delete config.styles
    return Object.assign(basicConfig, config)
  }
}

const layerFactary = new LayerFactary()

export default layerFactary
