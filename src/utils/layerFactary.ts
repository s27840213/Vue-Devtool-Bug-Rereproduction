import { ICalculatedGroupStyle } from '@/interfaces/group'
import { IShape, IText, IImage, IGroup, IFrame, ITmp, IStyle, ILayer } from '@/interfaces/layer'
import store from '@/store'
import GeneralUtils from '@/utils/generalUtils'
import ShapeUtils from '@/utils/shapeUtils'
import layerUtils from './layerUtils'
import ZindexUtils from './zindexUtils'

class LayerFactary {
  newImage(config: any): IImage {
    const { width, height, initWidth, initHeight, zindex } = config.styles
    const basicConfig = {
      type: 'image',
      ...(config.previewSrc && { previewSrc: config.previewSrc }),
      previewSrc: config.previewSrc,
      srcObj: {
        tpye: config.srcObj.type,
        userId: config.srcObj.userId,
        assetId: config.srcObj.assetId
      },
      id: config.id || GeneralUtils.generateRandomString(8),
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
        zindex: zindex ?? -1,
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
    const { designId, clips, decoration, decorationTop, styles, locked } = GeneralUtils.deepCopy(config) as IFrame
    let { width, height, initWidth, initHeight } = styles
    initWidth = initWidth || width
    initHeight = initHeight || height

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

    return {
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
        opacity: 100,
        horizontalFlip: styles.horizontalFlip,
        verticalFlip: styles.verticalFlip
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
        x: 0,
        y: 0,
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
     */
    if (config.paragraphs) {
      config.paragraphs.forEach((p, pidx) => {
        for (let i = 0; i < p.spans.length; i++) {
          if (typeof p.spans[i] === 'undefined' || (!p.spans[i].text && p.spans.length !== 1)) {
            console.warn('some empty span detected', pidx, i)
            p.spans.splice(i, 1)
            i--
            continue
          }
          if (typeof p.spans[i].text === 'undefined') {
            p.spans.splice(i, 1)
          } else if (p.spans[i].text.includes('\n')) {
            console.warn('some /n detected:', p.spans[i].text)
            p.spans[i].text.replace('\n', '')
          }
        }
      })

      config.paragraphs.forEach(p => {
        if (p.spans.length) {
          p.id = GeneralUtils.generateRandomString(8)
          p.styles.font = p.spans[0].styles.font
          p.spans.forEach(s => {
            s.id = GeneralUtils.generateRandomString(8)
          })
        }
      })
    }
    return Object.assign(basicConfig, config)
  }

  newGroup(config: IGroup, layers: Array<IShape | IText | IImage | IGroup>): IGroup {
    layers
      .forEach(l => {
        if (l.type === 'text') {
          const text = l as IText
          text.widthLimit = text.styles.writingMode.includes('vertical')
            ? text.styles.height : text.styles.width
        }
      })
    return {
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
        opacity: 100,
        horizontalFlip: config.styles.horizontalFlip as boolean || false,
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
      id: config.id || GeneralUtils.generateRandomString(8),
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
    if (config.color) {
      store.commit('UPDATE_documentColors', {
        pageIndex: layerUtils.pageIndex,
        colors: (config.color as Array<string>)
          .map(color => {
            return { color, count: 1 }
          })
      })
    }
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
      init(config.layers[layerIndex])
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
}

const layerFactary = new LayerFactary()

export default layerFactary
