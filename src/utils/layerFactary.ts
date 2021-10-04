import { ICalculatedGroupStyle } from '@/interfaces/group'
import { IShape, IText, IImage, IGroup, IFrame } from '@/interfaces/layer'
import GeneralUtils from '@/utils/generalUtils'
import ShapeUtils from '@/utils/shapeUtils'
import { init } from '@sentry/browser'

class LayerFactary {
  newImage(config: any): IImage {
    const { width, height, initWidth, initHeight } = config.styles
    const basicConfig = {
      type: 'image',
      srcObj: {
        tpye: config.srcObj.type,
        userId: config.srcObj.userId,
        assetId: config.srcObj.assetId
      },
      id: GeneralUtils.generateRandomString(8),
      clipPath: config.clipPath ?? '',
      active: false,
      shown: false,
      locked: false,
      moved: false,
      imgControl: false,
      isClipper: true,
      dragging: false,
      designId: '',
      styles: {
        x: 0,
        y: 0,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        width: width,
        height: height,
        initWidth: width,
        initHeight: height,
        imgX: 0,
        imgY: 0,
        imgWidth: initWidth ?? width,
        imgHeight: initHeight ?? height,
        zindex: -1,
        opacity: 100
      }
    }
    Object.assign(basicConfig.styles, config.styles)
    delete config.styles
    return Object.assign(basicConfig, config)
  }

  newFrame(config: IFrame): IFrame {
    const { clips, decoration, styles } = config
    let { width, height, initWidth, initHeight } = styles
    if (clips.length) {
      clips.forEach(img => {
        const imgConfig = {
          isFrame: true,
          clipPath: img.clipPath,
          styles: img.styles,
          srcObj: img.srcObj ?? {
            type: 'frame',
            assetId: '',
            userId: ''
          }
        }
        Object.assign(img, this.newImage(imgConfig))
      })
    } else {
      styles.scale = 1
      styles.scaleX = 1
      styles.scaleY = 1
      initWidth = width
      initHeight = height

      clips.push(this.newImage({
        styles: {
          width,
          height,
          initWidth: width,
          initHeight: height
        },
        srcObj: {
          type: 'frame',
          assetId: '',
          userId: ''
        }
      }))
    }
    return {
      type: 'frame',
      id: GeneralUtils.generateRandomString(8),
      active: false,
      shown: false,
      locked: false,
      moved: false,
      dragging: false,
      designId: config.designId ?? '',
      styles: {
        x: styles.x ?? 0,
        y: styles.y ?? 0,
        scale: styles.scale ?? 1,
        scaleX: styles.scaleX ?? 1,
        scaleY: styles.scaleY ?? 1,
        rotate: 0,
        width: width,
        height: height,
        initWidth: initWidth,
        initHeight: initHeight,
        zindex: -1,
        opacity: 100
      },
      clips,
      decoration: decoration ? this.newShape((() => {
        decoration.styles = {
          width: initWidth,
          height: initHeight,
          initWidth: initWidth,
          initHeight: initHeight
        } as any
        return decoration
      })()) : undefined
    }
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
      editing: false,
      dragging: false,
      designId: '',
      isEdited: false,
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
        align: 'center'
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
      className: ShapeUtils.classGenerator(),
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
        width: config.width,
        height: config.height,
        initWidth: config.width,
        initHeight: config.height,
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
