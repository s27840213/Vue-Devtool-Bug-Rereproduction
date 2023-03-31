import { ICalculatedGroupStyle } from '@/interfaces/group'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import { IFrame, IGroup, IImage, ILayer, IParagraph, IShape, IStyle, IText, ITmp } from '@/interfaces/layer'
import { LayerProcessType, LayerType } from '@/store/types'
import generalUtils from '@/utils/generalUtils'
import ShapeUtils from '@/utils/shapeUtils'
import { isEqual } from 'lodash'
import { STANDARD_TEXT_FONT } from './assetUtils'
import localeUtils from './localeUtils'
import mouseUtils from './mouseUtils'
import textPropUtils from './textPropUtils'
import ZindexUtils from './zindexUtils'
class LayerFactary {
  newImage(config: any, parentLayer?: any): IImage {
    const {
      width = 0, height = 0, initWidth = 0, initHeight = 0, imgWidth = 0, imgHeight = 0, imgX = 0, imgY = 0, zindex = 0, opacity = 0, scale = 1
    } = config.styles

    const basicConfig = {
      type: 'image',
      ...(config.previewSrc && { previewSrc: config.previewSrc }),
      srcObj: {
        ...config.srcObj
      },
      id: config.id || generalUtils.generateRandomString(8),
      clipPath: config.clipPath ?? `M0,0h${width}v${height}h${-width}z`,
      active: false,
      shown: false,
      locked: false,
      moved: false,
      moving: false,
      imgControl: false,
      inProcess: LayerProcessType.none,
      trace: config.trace ?? 0,
      isClipper: true,
      dragging: false,
      designId: '',
      styles: {
        x: 0,
        y: 0,
        scale,
        // scale: (!Number.isNaN(width / initWidth) && (width / initWidth)) ? (width / initWidth || 1) : 1,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        width: width,
        height: height,
        initWidth: width,
        initHeight: height,
        imgX: 0,
        imgY: 0,
        imgWidth: initWidth || width,
        imgHeight: initHeight || height,
        zindex: zindex ?? -1,
        opacity: opacity || 100,
        horizontalFlip: false,
        verticalFlip: false,
        adjust: {},
        shadow: {
          currentEffect: 'none',
          effects: {
            color: '#000000',
            frameColor: '#000000',
            ...Object.keys(ShadowEffectType)
              .reduce((obj, effect) => {
                return {
                  ...obj,
                  [effect]: {}
                }
              }, {})
          },
          srcObj: { type: '', assetId: '', userId: '' },
          styles: { imgWidth: 0, imgHeight: 0, imgX: 0, imgY: 0 },
          old: {}
        }
      }
    }
    /** some old json has different config with the shadow effect */
    if (config.styles.shadow && !Object.prototype.hasOwnProperty.call(config.styles.shadow, 'srcObj')) {
      config.styles.shadow = basicConfig.styles.shadow
    }
    const isImgSizeWrong = !imgWidth || !imgHeight || imgWidth + 1 < Math.abs(imgX) + width || imgHeight + 1 < Math.abs(imgY) + height
    if (isImgSizeWrong) {
      const layer = { styles: { width: basicConfig.styles.imgWidth, height: basicConfig.styles.imgHeight } } as unknown as IImage
      const clipperStyles = { width: basicConfig.styles.width, height: basicConfig.styles.height, scale: 1 } as IStyle
      const data = mouseUtils.clipperHandler(layer, '', clipperStyles)
      const { styles: { imgWidth, imgHeight, imgX, imgY } } = data
      config.styles.imgWidth = imgWidth
      config.styles.imgHeight = imgHeight
      config.styles.imgX = imgX
      config.styles.imgY = imgY
    }

    Object.assign(basicConfig.styles, config.styles)
    delete config.styles

    const image = Object.assign(basicConfig, config)
    return image
  }

  newFrame(config: IFrame): IFrame {
    const { designId, clips, decoration, decorationTop, styles, locked, blendLayers: _blendLayers } = generalUtils.deepCopy(config) as IFrame
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
        Object.assign(img, this.newImage(imgConfig, config))
      })
    } else if (clips.length) {
      // Template frame with image, need to copy the info of the image
      clips[0].styles.width = styles.width
      clips[0].styles.height = styles.height
      clips[0].styles.initHeight = styles.initHeight
      clips[0].styles.initWidth = styles.initWidth
      clips[0] = this.newImage(clips[0])
      // clips[0] = this.newImage(Object.assign(generalUtils.deepCopy(clips[0])))
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
      }, config))
    }
    if (clips.some(img => img.styles.rotate !== 0)) {
      const img = clips.find(img => img.styles.rotate !== 0) as IImage
      styles.rotate = img.styles.rotate
      img.styles.rotate = 0
    }
    const blendLayers = _blendLayers ? (_blendLayers as Array<unknown>)
      .map((l: any) => {
        const newStyles = {} as any
        newStyles.width = width / styles.scale
        newStyles.height = height / styles.scale
        newStyles.initWidth = width / styles.scale
        newStyles.initHeight = height / styles.scale
        newStyles.blendMode = l.blendMode
        l.styles = newStyles
        l.vSize = [newStyles.width, newStyles.height]
        return this.newShape(l)
      }) : undefined

    const frame = {
      type: 'frame',
      id: config.id || generalUtils.generateRandomString(8),
      active: false,
      shown: false,
      locked: locked ?? false,
      moved: false,
      moving: false,
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
        verticalFlip: styles.verticalFlip || false,
        shadow: styles.shadow
      },
      clips,
      blendLayers,
      decoration: decoration && !clips[0].isFrameImg ? this.newShape((() => {
        decoration.vSize = [initWidth, initHeight]
        decoration.styles = {
          width: initWidth,
          height: initHeight,
          initWidth: initWidth,
          initHeight: initHeight
        } as IStyle
        return decoration
      })()) : undefined,
      decorationTop: decorationTop && !clips[0].isFrameImg ? this.newShape((() => {
        decorationTop.vSize = [initWidth, initHeight]
        decorationTop.styles = {
          width: initWidth,
          height: initHeight,
          initWidth: initWidth,
          initHeight: initHeight
        } as IStyle
        return decorationTop
      })()) : undefined
    } as IFrame
    frame.clips.forEach(i => (i.parentLayerStyles = frame.styles))
    if (frame.decoration && !frame.decoration.svg) {
      (frame as any).needFetch = true
    } else if (frame.decorationTop && !frame.decorationTop.svg) {
      (frame as any).needFetch = true
    }
    return frame
  }

  newText(config: Partial<IText>): IText {
    const basicConfig = {
      type: 'text',
      id: config.id || generalUtils.generateRandomString(8),
      widthLimit: -1,
      isTyping: false,
      active: false,
      shown: false,
      locked: false,
      moved: false,
      moving: false,
      editing: false,
      dragging: false,
      designId: '',
      isEdited: false,
      contentEditable: config.contentEditable ?? false,
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
        verticalFlip: false,
        textEffect: { name: 'none' },
        textBg: { name: 'none' },
        textShape: { name: 'none' },
        textFill: { name: 'none' },
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
      },
      isAutoResizeNeeded: false,
      isCompensated: true
    }
    Object.assign(basicConfig.styles, config.styles)
    delete config.styles

    /**
     * For the past structure, some text might have wrong structure
     * below fix the wrong part
     * 1: empty span
     * 2: underline or italic w/ vertical (vertical text cannot be underlined or italic)
     * 3: span style that has only font but no type
     * 4: font size smaller than browser minimum font size setting
     * 5: span has no text and is the only span in the paragraph
     * 6: font is in wrong format (e.g. contains a comma)
     * 7: span has no font
     * 8: span contains invalid unicode characters (which breaks emoji)
     * 9: replace textShape and textEffect value {} to {name: none}
     */
    if (config.paragraphs) {
      const paragraphs = config.paragraphs as IParagraph[]
      // some paragraphs contain empty spans.
      for (let pidx = 0; pidx < paragraphs.length; pidx++) {
        const spans = paragraphs[pidx].spans
        if (spans.length === 0) {
          paragraphs.splice(pidx, 1)
          pidx--
        } else if (spans.length === 1) {
          const span = spans[0]
          // 5: span has no text and is the only span in the paragraph
          if (span.text === undefined) {
            paragraphs.splice(pidx, 1)
            pidx--
          }
        } else {
          for (let sidx = 0; sidx < spans.length; sidx++) {
            const span = spans[sidx]
            // 1: empty span
            if (!span.text && spans.length > 1) {
              spans.splice(sidx, 1)
              sidx--
            }
          }
        }
      }
      const isVertical = basicConfig.styles.writingMode.includes('vertical')
      const defaultFont = (Object.keys(STANDARD_TEXT_FONT).includes(localeUtils.currLocale())) ? STANDARD_TEXT_FONT[localeUtils.currLocale()] : STANDARD_TEXT_FONT.tw
      // 2: underline or italic w/ vertical (vertical text cannot be underlined or italic)
      textPropUtils.removeInvalidStyles(config.paragraphs, isVertical, config.isCompensated,
        (paragraph) => {
          if (paragraph.spans.length > 0) {
            const firstSpanStyles = paragraph.spans[0].styles
            if (firstSpanStyles.font) {
              // 3: span style that has only font but no type
              paragraph.styles.font = firstSpanStyles.font
              paragraph.styles.type = firstSpanStyles.type ?? 'public'
              paragraph.styles.userId = firstSpanStyles.userId ?? ''
              paragraph.styles.assetId = firstSpanStyles.assetId ?? ''
              paragraph.styles.fontUrl = firstSpanStyles.fontUrl ?? ''
            } else {
              // 7: span has no font
              paragraph.styles.font = defaultFont
              paragraph.styles.type = 'public'
              paragraph.styles.userId = ''
              paragraph.styles.assetId = ''
              paragraph.styles.fontUrl = ''
            }
            // 6: font is in wrong format (e.g. contains a comma)
            if (paragraph.styles.font.includes(',')) {
              paragraph.styles.font = paragraph.styles.font.split(',')[0]
            }
            if ((paragraph.spans.length > 1 || paragraph.spans[0].text !== '') && paragraph.spanStyle) {
              delete paragraph.spanStyle
            }
          }
        },
        (span) => {
          // 8: span contains invalid unicode characters (which breaks emoji)
          span.text = span.text.replace(/[\ufe0e\ufe0f]/g, '')
        },
        undefined,
        (span) => {
          // This needs to be done after removeInvalidStyles's span processing,
          // because span's font is guaranteed to exist after that.
          // 6: font is in wrong format (e.g. contains a comma)
          if (span.styles.font.includes(',')) {
            span.styles.font = span.styles.font.split(',')[0]
          }
        }
      )
      // 4: font size smaller than browser minimum font size setting
      if (config.isCompensated) {
        const baseFontSize = textPropUtils.getBaseFontSizeOfParagraphs(config.paragraphs)
        const compensation = textPropUtils.getScaleCompensation(baseFontSize)
        if (compensation.needCompensation) {
          basicConfig.styles.scale *= compensation.scale
          config.paragraphs = textPropUtils.propAppliedParagraphs(config.paragraphs, 'size', 0, (size) => {
            return size / compensation.scale
          })
        }
      }
    }
    // 9: replace textShape and textEffect value {} to {name: none}
    for (const key of ['textShape', 'textEffect'] as const) {
      if (isEqual(basicConfig.styles[key], {})) basicConfig.styles[key] = { name: 'none' }
    }
    return Object.assign(basicConfig, config)
  }

  newGroup(config: IGroup, layers: Array<IShape | IText | IImage | IFrame>): IGroup {
    const group: IGroup = {
      type: 'group',
      id: config.id || generalUtils.generateRandomString(8),
      active: false,
      shown: false,
      locked: config.locked ?? false,
      moved: false,
      moving: false,
      dragging: false,
      designId: config.designId,
      db: config.db,
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
    group.layers.forEach(l => {
      l.type === LayerType.image && (l.parentLayerStyles = group.styles)
    })
    return group
  }

  newTmp(styles: ICalculatedGroupStyle, layers: Array<IShape | IText | IImage | IGroup | IFrame>) {
    const tmp: ITmp = {
      type: 'tmp',
      id: generalUtils.generateRandomString(8),
      active: true,
      shown: false,
      locked: false,
      moved: false,
      moving: false,
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
    }
    tmp.layers.forEach(l => l.type === LayerType.image && (l.parentLayerStyles = tmp.styles))
    return tmp
  }

  newShape(config?: any): IShape {
    config = config || {}
    const { styles = {} } = generalUtils.deepCopy(config)
    const basicConfig = {
      type: 'shape',
      id: generalUtils.generateRandomString(8),
      active: false,
      shown: false,
      path: '',
      color: [],
      size: [],
      styleArray: [],
      svg: '',
      vSize: styles.vSize ?? [0, 0],
      cSize: [0, 0],
      pSize: [0, 0],
      pDiff: [0, 0],
      ratio: 1,
      category: '',
      className: ShapeUtils.classGenerator(),
      locked: false,
      moved: false,
      moving: false,
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
        width: styles.width || 0,
        height: styles.height || 0,
        initWidth: styles.initWidth || 0,
        initHeight: styles.initHeight || 0,
        zindex: -1,
        opacity: styles.opacity ?? 100,
        horizontalFlip: styles.horizontalFlip || false,
        verticalFlip: styles.verticalFlip || false,
        blendMode: styles.blendMode || ''
      }
    }
    if (config.category === 'A' && styles.scale && styles.initWidth && styles.initHeight) {
      basicConfig.styles.width = styles.initWidth * styles.scale
      basicConfig.styles.height = styles.initHeight * styles.scale
    }
    delete config.styles
    // delete config.blendMode
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
    bgImgConfig.id = generalUtils.generateRandomString(8)
    if (bgImgConfig.srcObj.type) {
      if (!bgImgConfig.srcObj.userId && !bgImgConfig.srcObj.assetId) {
        config.backgroundImage.config.srcObj = { type: '', userId: '', assetId: '' }
      }
    }
    return config
  }

  newByLayerType(config: any, parentLayer?: any): IShape | IText | IImage | IFrame | IGroup | ITmp {
    this.paramsExaminer(config)
    switch (config.type) {
      case 'shape':
        return this.newShape(config)
      case 'text':
        return this.newText(config)
      case 'image':
        return this.newImage(config, parentLayer)
      case 'frame':
        return this.newFrame(config)
      case 'group':
        return this.newGroup(config, config.layers)
      case 'tmp':
        for (const layerIndex in config.layers) {
          config.layers[layerIndex] = this.newByLayerType(config.layers[layerIndex], config)
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
