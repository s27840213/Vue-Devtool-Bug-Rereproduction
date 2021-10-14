import { ICalculatedGroupStyle } from '@/interfaces/group'
import { IShape, IText, IImage, IGroup, IFrame, ITmp } from '@/interfaces/layer'
import GeneralUtils from '@/utils/generalUtils'
import ShapeUtils from '@/utils/shapeUtils'
import ZindexUtils from './zindexUtils'
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
      clipPath: config.clipPath ?? `M0,0h${width}v${height}h${-width}z`,
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
        opacity: 100,
        horizontalFlip: false,
        verticalFlip: false,
        adjust: {}
      }
    }
    Object.assign(basicConfig.styles, config.styles)
    delete config.styles
    return Object.assign(basicConfig, config)
  }

  newFrame(config: IFrame): IFrame {
    const { designId, clips, decoration, decorationTop, styles } = config
    let { width, height, initWidth, initHeight } = styles
    initWidth = initWidth || width
    initHeight = initHeight || height

    if (clips.length && !clips[0].isFrameImg) {
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
    } else if (clips.length) {
      clips[0] = this.newImage(Object.assign(GeneralUtils.deepCopy(clips[0])))
      clips[0].isFrameImg = true
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
        },
        isFrameImg: true
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
      designId: designId ?? '',
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
        opacity: 100,
        horizontalFlip: false,
        verticalFlip: false
      },
      clips,
      decoration: decoration ? this.newShape((() => {
        decoration.vSize = [initWidth, initHeight]
        decoration.styles = {
          width: initWidth,
          height: initHeight,
          initWidth: initWidth,
          initHeight: initHeight
        } as any
        return decoration
      })()) : undefined,
      decorationTop: decorationTop ? this.newShape((() => {
        decorationTop.vSize = [initWidth, initHeight]
        decorationTop.styles = {
          width: initWidth,
          height: initHeight,
          initWidth: initWidth,
          initHeight: initHeight
        } as any
        return decorationTop
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
        align: 'center',
        horizontalFlip: false,
        verticalFlip: false
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
        scale: styles.scale as number ?? 1,
        scaleX: styles.scaleX as number ?? 1,
        scaleY: styles.scaleY as number ?? 1,
        rotate: styles.rotate as number ?? 1,
        width: styles.width,
        height: styles.height,
        initWidth: styles.width,
        initHeight: styles.height,
        zindex: -1,
        opacity: 100,
        horizontalFlip: styles.horizontalFlip as boolean || false,
        verticalFlip: false
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
        opacity: 100,
        horizontalFlip: false,
        verticalFlip: false
      },
      layers: layers
    }
  }

  newShape(config: any): IShape {
    const { styles } = config
    const basicConfig = {
      type: 'shape',
      id: GeneralUtils.generateRandomString(8),
      active: false,
      shown: false,
      path: '',
      color: [],
      size: [],
      styleArray: [],
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
        x: styles.x ?? 0,
        y: styles.y ?? 0,
        scale: styles.scale ?? 1,
        scaleX: styles.scaleX ?? 1,
        scaleY: styles.scaleY ?? 1,
        rotate: styles.rotate ?? 0,
        width: styles.width,
        height: styles.height,
        initWidth: styles.initWidth,
        initHeight: styles.initHeight,
        zindex: -1,
        opacity: 100,
        horizontalFlip: false,
        verticalFlip: false
      }
    }
    Object.assign(basicConfig.styles, config.styles)
    delete config.styles
    return Object.assign(basicConfig, config)
  }

  newTemplate(config: any): any {
    for (const layerIndex in config.layers) {
      config.layers[layerIndex] = this.newByLayerType(config.layers[layerIndex])
      if (config.layers[layerIndex].type === 'frame') {
        config.layers[layerIndex].needFetch = true
      }
    }
    config.layers = ZindexUtils.assignTemplateZidx(config.layers)
    return config
  }

  newByLayerType(config: any): IShape | IText | IImage | IFrame | IGroup | ITmp {
    switch (config.type) {
      case 'shape':
        return this.newShape(config)
      case 'text':
        return this.newText(config)
      case 'image':
        return this.newImage(config)
      case 'frame':
        return this.newFrame(config)
      case 'group':
        for (const layerIndex in config.layers) {
          config.layers[layerIndex] = this.newByLayerType(config.layers[layerIndex])
        }
        return this.newGroup(config.styles, config.layers)
      case 'tmp':
        for (const layerIndex in config.layers) {
          config.layers[layerIndex] = this.newByLayerType(config.layers[layerIndex])
        }
        return this.newTmp(config.styles, config.layers)
      default:
        throw new Error(`Unknown layer type: ${config.type}`)
    }
  }
}

const layerFactary = new LayerFactary()

export default layerFactary
