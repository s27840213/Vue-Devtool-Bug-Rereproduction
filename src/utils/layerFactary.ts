import { ICalculatedGroupStyle } from '@/interfaces/group'
import { IShape, IText, IImage, IGroup, IFrame, ITmp, IStyle, ILayer, IParagraph } from '@/interfaces/layer'
import store from '@/store'
import { LayerType } from '@/store/types'
import GeneralUtils from '@/utils/generalUtils'
import ShapeUtils from '@/utils/shapeUtils'
import { STANDARD_TEXT_FONT } from './assetUtils'
import layerUtils from './layerUtils'
import localeUtils from './localeUtils'
import textPropUtils from './textPropUtils'
import tiptapUtils from './tiptapUtils'
import ZindexUtils from './zindexUtils'
import imageShadowUtils from './imageShadowUtils'
import { ShadowEffectType } from '@/interfaces/imgShadow'

class LayerFactary {
  newImage(config: any): IImage {
    const { width, height, initWidth, initHeight, zindex, opacity } = config.styles
    const basicConfig = {
      type: 'image',
      ...(config.previewSrc && { previewSrc: config.previewSrc }),
      previewSrc: config.previewSrc,
      srcObj: {
        ...config.srcObj
      },
      id: config.id || GeneralUtils.generateRandomString(8),
      clipPath: config.clipPath ?? `M0,0h${width}v${height}h${-width}z`,
      active: false,
      shown: false,
      locked: false,
      moved: false,
      imgControl: false,
      inProcess: false,
      trace: config.trace ?? 0,
      isClipper: true,
      dragging: false,
      designId: '',
      styles: {
        x: 0,
        y: 0,
        scale: width / initWidth,
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
        zindex: zindex ?? -1,
        opacity: opacity || 100,
        horizontalFlip: false,
        verticalFlip: false,
        adjust: {},
        shadow: {
          currentEffect: 'none',
          effects: {
            color: '#000000',
            ...Object.keys(ShadowEffectType)
              .reduce((obj, effect) => {
                return {
                  ...obj,
                  [effect]: {}
                }
              }, {})
          },
          srcObj: { type: '', assetId: '', userId: '' },
          styles: { imgWidth: 0, imgHeight: 0, imgX: 0, imgY: 0 }
        }
      }
    }
    Object.assign(basicConfig.styles, config.styles)
    delete config.styles

    basicConfig.styles.scale = basicConfig.styles.width / basicConfig.styles.initWidth
    const image = Object.assign(basicConfig, config)
    return image
  }

  newFrame(config: IFrame): IFrame {
    const { designId, clips, decoration, decorationTop, styles, locked } = GeneralUtils.deepCopy(config) as IFrame
    let { width, height, initWidth, initHeight } = styles
    initWidth = initWidth || width
    initHeight = initHeight || height

    if (!decoration && !decorationTop && (!designId || designId === '') && clips.length === 1 && !clips[0].clipPath) {
      clips[0].isFrameImg = true
    }

    if (clips.length && !clips[0].isFrameImg) {
      clips.forEach((img, i) => {
        img.styles.zindex = i
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
      // Template frame with image, need to copy the info of the image
      clips[0] = this.newImage(Object.assign(GeneralUtils.deepCopy(clips[0])))
      clips[0].isFrameImg = true
    } else {
      // New image-frame no image info need to be resored
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

    if (clips.some(img => img.styles.rotate !== 0)) {
      const img = clips.find(img => img.styles.rotate !== 0) as IImage
      styles.rotate = img.styles.rotate
      img.styles.rotate = 0
    }

    const frame = {
      type: 'frame',
      id: config.id || GeneralUtils.generateRandomString(8),
      active: false,
      shown: false,
      locked: locked ?? false,
      moved: false,
      dragging: false,
      designId: designId ?? '',
      styles: {
        x: styles.x ?? 0,
        y: styles.y ?? 0,
        scale: styles.scale ?? 1,
        scaleX: styles.scaleX ?? 1,
        scaleY: styles.scaleY ?? 1,
        rotate: styles.rotate ?? 0,
        width: width,
        height: height,
        initWidth: initWidth,
        initHeight: initHeight,
        zindex: styles.zindex ?? -1,
        opacity: styles.opacity || 100,
        horizontalFlip: styles.horizontalFlip || false,
        verticalFlip: styles.verticalFlip || false
      },
      clips,
      decoration: decoration ? this.newShape((() => {
        decoration.vSize = [initWidth, initHeight]
        decoration.styles = {
          width: initWidth,
          height: initHeight,
          initWidth: initWidth,
          initHeight: initHeight
        } as IStyle
        return decoration
      })()) : undefined,
      decorationTop: decorationTop ? this.newShape((() => {
        decorationTop.vSize = [initWidth, initHeight]
        decorationTop.styles = {
          width: initWidth,
          height: initHeight,
          initWidth: initWidth,
          initHeight: initHeight
        } as IStyle
        return decorationTop
      })()) : undefined
    }
    frame.clips.forEach(i => (i.parentLayerStyles = frame.styles))
    return frame
  }

  newText(config: Partial<IText>): IText {
    const basicConfig = {
      type: 'text',
      id: config.id || GeneralUtils.generateRandomString(8),
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
      contentEditable: false,
      styles: {
        x: config.styles?.x,
        y: config.styles?.y,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        width: config.styles?.width ? config.styles.width : 0,
        height: config.styles?.width ? config.styles.width : 0,
        initWidth: config.styles?.width ? config.styles.width : 0,
        initHeight: config.styles?.height ? config.styles.height : 0,
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
                userId: '',
                assetId: '',
                fontUrl: '',
                type: 'public',
                weight: 'normal',
                color: '#000000',
                size: 72,
                decoration: 'none',
                style: 'normal'
              }
            }
          ]
        }
      ],
      selection: {
        from: 0,
        to: 0
      }
    }
    Object.assign(basicConfig.styles, config.styles)
    delete config.styles

    /**
     * For the past structure, some text might have wrong structure
     * below fix the wrong part
     * 1: empty span
     * 2: underline or italic w/ vertical (vertical text cannot be underlined or italic)
     * 3: span style that has only font but no type
     */
    if (config.paragraphs) {
      const paragraphs = config.paragraphs as IParagraph[]
      // some paragraphs contain empty spans.
      for (let pidx = 0; pidx < paragraphs.length; pidx++) {
        if (paragraphs[pidx].spans.length === 0) {
          paragraphs.splice(pidx, 1)
          pidx--
        } else if (paragraphs[pidx].spans.length > 1) {
          for (let sidx = 0; sidx < paragraphs[pidx].spans.length; sidx++) {
            if (!paragraphs[pidx].spans[sidx].text && paragraphs[pidx].spans.length > 1) {
              paragraphs[pidx].spans.splice(sidx, 1)
              sidx--
            }
          }
        }
      }
      const isVertical = basicConfig.styles.writingMode.includes('vertical')
      const defaultFont = (Object.keys(STANDARD_TEXT_FONT).includes(localeUtils.currLocale())) ? STANDARD_TEXT_FONT[localeUtils.currLocale()] : STANDARD_TEXT_FONT.tw
      textPropUtils.removeInvalidStyles(config.paragraphs, isVertical,
        (paragraph) => {
          if (paragraph.spans.length > 0) {
            const firstSpanStyles = paragraph.spans[0].styles
            if (firstSpanStyles.font) {
              paragraph.styles.font = firstSpanStyles.font
              paragraph.styles.type = firstSpanStyles.type ?? 'public'
              paragraph.styles.userId = firstSpanStyles.userId ?? ''
              paragraph.styles.assetId = firstSpanStyles.assetId ?? ''
              paragraph.styles.fontUrl = firstSpanStyles.fontUrl ?? ''
            } else {
              paragraph.styles.font = defaultFont
              paragraph.styles.type = 'public'
              paragraph.styles.userId = ''
              paragraph.styles.assetId = ''
              paragraph.styles.fontUrl = ''
            }
            if (paragraph.styles.spanStyle) {
              delete paragraph.styles.spanStyle
            }
          } else if (paragraph.styles.spanStyle) {
            const spanStyles = tiptapUtils.generateSpanStyle(paragraph.styles.spanStyle as string)
            paragraph.styles.font = spanStyles.font
            paragraph.styles.type = spanStyles.type ?? 'public'
            paragraph.styles.userId = spanStyles.userId ?? ''
            paragraph.styles.assetId = spanStyles.assetId ?? ''
            paragraph.styles.fontUrl = spanStyles.fontUrl ?? ''
          } else {
            paragraph.styles.font = defaultFont
            paragraph.styles.type = 'public'
            paragraph.styles.userId = ''
            paragraph.styles.assetId = ''
            paragraph.styles.fontUrl = ''
          }
        }
      )
    }
    return Object.assign(basicConfig, config)
  }

  newGroup(config: IGroup, layers: Array<IShape | IText | IImage | IGroup>): IGroup {
    const group = {
      type: 'group',
      id: config.id || GeneralUtils.generateRandomString(8),
      active: false,
      shown: false,
      locked: config.locked ?? false,
      moved: false,
      dragging: false,
      designId: config.designId,
      styles: {
        x: config.styles.x,
        y: config.styles.y,
        scale: config.styles.scale as number ?? 1,
        scaleX: config.styles.scaleX as number ?? 1,
        scaleY: config.styles.scaleY as number ?? 1,
        rotate: config.styles.rotate as number ?? 1,
        width: config.styles.width,
        height: config.styles.height,
        initWidth: config.styles.initWidth ?? config.styles.width,
        initHeight: config.styles.initHeight ?? config.styles.height,
        zindex: -1,
        opacity: config.styles.opacity || 1,
        horizontalFlip: config.styles.horizontalFlip as boolean || false,
        verticalFlip: false
      },
      layers: layers
        .flatMap((l, idx) => {
          /* If the designId and the svg is empty,
          /* delete the layer */
          if (l.type === LayerType.shape) {
            const shape = l as IShape
            if (!shape.designId && !shape.svg && !['D', 'E'].includes(shape.category)) {
              console.warn('layer in group at index:', idx, 'has no designId and empty svg, it has been removed!')
              return []
            }
            !shape.designId && console.warn('layer in group at index:', idx, 'has no designId!')
          }
          return [this.newByLayerType(l) as IShape | IText | IImage]
        })
    }
    group.layers.forEach(l => l.type === LayerType.image && (l.parentLayerStyles = group.styles))
    return group
  }

  newTmp(styles: ICalculatedGroupStyle, layers: Array<IShape | IText | IImage | IGroup>) {
    const tmp = {
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
        scale: styles.scale as number || 1,
        scaleX: styles.scaleX as number || 1,
        scaleY: styles.scaleY as number || 1,
        rotate: styles.rotate as number || 0,
        width: styles.width,
        height: styles.height,
        initWidth: styles.width,
        initHeight: styles.height,
        zindex: 0,
        opacity: styles.opacity as number || 100,
        horizontalFlip: false,
        verticalFlip: false
      },
      layers
    } as unknown as ITmp
    tmp.layers.forEach(l => l.type === LayerType.image && (l.parentLayerStyles = tmp.styles))
    return tmp
  }

  newShape(config: any): IShape {
    const { styles } = GeneralUtils.deepCopy(config)
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
      designId: config.designId || '',
      ...(config.category === 'E' && { filled: false }),
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
        opacity: styles.opacity || 100,
        horizontalFlip: styles.horizontalFlip || false,
        verticalFlip: styles.verticalFlip || false
      }
    }
    delete config.styles
    delete config.id
    return Object.assign(basicConfig, config)
  }

  newTemplate(config: any): any {
    const init = (layer: ILayer) => {
      switch (layer.type) {
        case 'frame': {
          const frame = layer as IFrame
          if (!frame.clips[0].isFrameImg) {
            frame.needFetch = true
          }
        }
          break
        case 'group': {
          const group = layer as IGroup
          group.layers
            .forEach(l => init(l))
        }
      }
    }

    if (config.layers === undefined) return config
    for (const layerIndex in config.layers) {
      config.layers[layerIndex] = this.newByLayerType(config.layers[layerIndex])

      /* If the designId and the svg is empty,
      /* delete the layer */
      if (config.layers[layerIndex].type === LayerType.shape) {
        const shape = config.layers[layerIndex] as IShape
        if (!shape.designId && !shape.svg && !['D', 'E'].includes(shape.category)) {
          config.layers.splice(+layerIndex, 1)
          console.warn('layer:', layerIndex, 'has no designId and empty svg, it has been removed!')
          continue
        }
        !shape.designId && console.warn('layer:', layerIndex, 'has no designId!')
      }

      init(config.layers[layerIndex])
    }
    config.layers = ZindexUtils.assignTemplateZidx(config.layers)
    const bgImgConfig = config.backgroundImage.config
    bgImgConfig.id = GeneralUtils.generateRandomString(8)
    if (bgImgConfig.srcObj.type && !bgImgConfig.srcObj.userId && !bgImgConfig.srcObj.assetId) {
      config.backgroundImage.config.srcObj = { type: '', userId: '', assetId: '' }
    }
    return config
  }

  newByLayerType(config: any): IShape | IText | IImage | IFrame | IGroup | ITmp {
    this.paramsExaminer(config)
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
        return this.newGroup(config, config.layers)
      case 'tmp':
        for (const layerIndex in config.layers) {
          config.layers[layerIndex] = this.newByLayerType(config.layers[layerIndex])
        }
        console.error('Basically, the template should not have the layer type of tmp')
        return this.newTmp(config.styles, config.layers)
      default:
        throw new Error(`Unknown layer type: ${config.type}`)
    }
  }

  paramsExaminer(config: ILayer) {
    const { styles } = config
    const { opacity } = styles
    if (typeof opacity !== 'number') {
      styles.opacity = parseFloat(opacity)
    }
  }
}

const layerFactary = new LayerFactary()

export default layerFactary
