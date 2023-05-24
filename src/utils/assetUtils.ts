import listApi from '@/apis/list'
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import { SrcObj } from '@/interfaces/gallery'
import { IGroup, IImage, IImageStyle, IShape, ISpanStyle, IStyle, IText, ITmp } from '@/interfaces/layer'
import { IAsset, IAssetProps } from '@/interfaces/module'
import { IBleed, IPage } from '@/interfaces/page'
import store from '@/store'
import logUtils from '@/utils/logUtils'
import { notify } from '@kyvg/vue3-notification'
import { captureException } from '@sentry/browser'
import { round } from 'lodash'
import { nextTick } from 'vue'
import backgroundUtils from './backgroundUtils'
import ControlUtils from './controlUtils'
import editorUtils from './editorUtils'
import errorHandleUtils from './errorHandleUtils'
import generalUtils from './generalUtils'
import GroupUtils from './groupUtils'
import gtmUtils from './gtmUtils'
import ImageUtils from './imageUtils'
import LayerFactary from './layerFactary'
import layerUtils from './layerUtils'
import mathUtils from './mathUtils'
import pageUtils from './pageUtils'
import resizeUtils from './resizeUtils'
import ShapeUtils from './shapeUtils'
import stepsUtils from './stepsUtils'
import TemplateUtils from './templateUtils'
import textShapeUtils from './textShapeUtils'
import textUtils from './textUtils'
import tiptapUtils from './tiptapUtils'
import unitUtils, { PRECISION } from './unitUtils'
import vivistickerUtils from './vivistickerUtils'
import ZindexUtils from './zindexUtils'

export const STANDARD_TEXT_FONT: { [key: string]: string } = {
  tw: 'OOcHgnEpk9RHYBOiWllz',
  us: 'cRgaSK5ZVXnLDpWTL8MN',
  en: 'cRgaSK5ZVXnLDpWTL8MN',
  jp: 'OyDbjZxjk9r14eZnPELb'
}
export const RESIZE_RATIO_FRAME = 0.6
export const RESIZE_RATIO_SVG = 0.55
export const RESIZE_RATIO_IMAGE = 0.8
export const RESIZE_RATIO_TEXT = 0.55
class AssetUtils {
  host = 'https://template.vivipic.com'
  data = 'config.json'
  preview = 'prev'

  get getAsset() { return store.getters.getAsset }
  get getPage() { return store.getters.getPage }
  get pageSize() { return store.getters.getPageSize(pageUtils.currFocusPageIndex) }
  get getLayer() { return store.getters.getLayer }
  get layerIndex() { return store.getters.getCurrSelectedIndex }
  get getLayers() { return store.getters.getLayers }
  get getPages() { return store.getters.getPages }

  get(item: IListServiceContentDataItem, db?: string): Promise<IAsset> {
    return this.fetch(item, db)
  }

  // used for api category
  getTypeCategory(type: number): string | undefined {
    // @TODO 暫時
    const typeStrMap = {
      0: 'font',
      1: 'background',
      5: 'svg',
      6: 'template',
      7: 'text',
      8: 'svg',
      9: 'svg',
      10: 'svg',
      11: 'svg',
      14: 'svg',
      15: 'svg',
      16: 'giphy'
    } as { [key: number]: string }
    return typeStrMap[type]
  }

  getLayerType(type: number): string | undefined {
    const typeStrMap = {
      5: 'shape',
      7: 'text',
      8: 'frame',
      9: 'shape',
      10: 'shape',
      11: 'shape'
    } as { [key: number]: string }
    return typeStrMap[type]
  }

  getTypeModule(type: number): string | undefined {
    // @TODO 暫時
    const typeModuleMap = {
      0: 'font',
      1: 'background',
      6: 'templates',
      7: 'textStock',
      5: 'objects',
      8: 'objects',
      9: 'objects',
      10: 'objects',
      11: 'objects',
      14: 'objects',
      15: 'objects',
      16: 'giphy'
    } as { [key: number]: string }
    return typeModuleMap[type]
  }

  getFontMap(): { [key: string]: string } {
    return STANDARD_TEXT_FONT
  }

  fetch(item: IListServiceContentDataItem, db?: string): Promise<IAsset> {
    const { id, type, ver, ...attrs } = item
    const typeCategory = db ?? this.getTypeCategory(type)
    const asset = {
      id,
      type,
      ver,
      urls: {
        prev: [this.host, typeCategory, id, this.preview].join('/'),
        json: [this.host, typeCategory, id, this.data].join('/')
      },
      ...attrs
    } as IAsset
    switch (type) {
      case 1: {
        const srcObj = { type: typeCategory, assetId: id, userId: '' }
        asset.urls.full = ImageUtils.getSrc({ srcObj } as IImage)
        store.commit('SET_assetJson', { [id]: asset })
        return Promise.resolve(asset)
      }
      case 15:
        return Promise.resolve(asset)
      default: {
        return Promise.race([
          fetch(asset.urls.json + `?ver=${ver}`),
          new Promise((resolve, reject) => setTimeout(() => reject(new Error('timeout')), 30000))
        ]).then((response: any) => {
          if (!response.ok) {
            throw new Error(response.status.toString())
          }
          return response.json()
        }).then(jsonData => {
          asset.jsonData = jsonData
          store.commit('SET_assetJson', { [id]: asset })
          return asset
        }).catch((error) => {
          if (asset.type === 5 && error.message === '404') {
            errorHandleUtils.addMissingDesign('svg', asset.id)
          } else {
            notify({
              group: 'error',
              text: `網路異常，請確認網路正常後再嘗試。(ErrorCode: ${error.message === 'Failed to fetch' ? 19 : error.message})`
            })
          }
          return asset
        })
      }
    }
  }

  async addTemplate(json: any, attrs?: { pageIndex?: number, width?: number, height?: number, physicalWidth?: number, physicalHeight?: number, unit?: string }, recordStep = true) {
    console.log('addTemplate')
    const targetPageIndex = attrs?.pageIndex ?? pageUtils.addAssetTargetPageIndex
    const targetPage: IPage = this.getPage(targetPageIndex)
    json = await this.updateBackground(generalUtils.deepCopy(json))
    // pageUtils.setAutoResizeNeededForPage(json, true)
    layerUtils.setAutoResizeNeededForLayersInPage(json, true)
    const newPage = LayerFactary.newTemplate(TemplateUtils.updateTemplate(json))
    console.log(generalUtils.deepCopy(newPage))
    pageUtils.updateSpecPage(targetPageIndex, newPage)
    if (attrs?.width && attrs?.height) resizeUtils.resizePage(targetPageIndex, newPage, { width: attrs.width, height: attrs.height, physicalWidth: attrs.physicalWidth, physicalHeight: attrs.physicalHeight, unit: attrs.unit })

    if (store.getters['user/getUserId'] === 'backendRendering') {
      const { isBleed, isTrim } = store.getters['user/getBackendRenderParams']
      if (isBleed || isTrim) {
        pageUtils.setIsEnableBleed(true, targetPageIndex)
        if (json.bleeds && json.physicalBleeds) pageUtils.setBleeds(targetPageIndex, json.physicalBleeds, json.bleeds) // use bleeds of page if it has
      } else pageUtils.setIsEnableBleed(false, targetPageIndex)
    } else if (attrs && attrs.width && attrs.height) { // use page size
      let physicalBleeds
      if (targetPage.bleeds && targetPage.physicalBleeds) {
        const resizedPage = this.getPage(targetPageIndex)

        // convert bleeds to template unit
        const dpi = pageUtils.getPageDPI(resizedPage)
        physicalBleeds = resizedPage.unit === 'px' ? targetPage.bleeds
          : targetPage.unit === attrs?.unit ? targetPage.physicalBleeds
            : Object.fromEntries(Object.entries(targetPage.physicalBleeds).map(([k, v]) => [k, unitUtils.convert(v, targetPage.unit, resizedPage.unit, k === 'left' || k === 'right' ? dpi.width : dpi.height)])) as IBleed
      }

      // apply bleeds of targetPage
      pageUtils.setIsEnableBleed(!!targetPage.isEnableBleed, targetPageIndex)
      if (physicalBleeds) pageUtils.setBleeds(targetPageIndex, physicalBleeds)

      // fit page background if the template has background image
      if (json.backgroundImage.config.srcObj.assetId) backgroundUtils.fitPageBackground(targetPageIndex)
    }
    GroupUtils.deselect()
    store.commit('SET_currActivePageIndex', targetPageIndex)
    if (recordStep) {
      stepsUtils.record()
    }
  }

  async addTemplateToAllPages(json: any, attrs: IAssetProps = {}, recordStep = true) {
    const { width, height } = attrs
    const pageNum = pageUtils.pageNum
    // const targetPage: IPage = this.getPage(targetPageIndex)

    for (let i = 0; i < pageNum; i++) {
      json = await this.updateBackground(generalUtils.deepCopy(json))
      layerUtils.setAutoResizeNeededForLayersInPage(json, true)
      const newPage = LayerFactary.newTemplate(TemplateUtils.updateTemplate(json))
      pageUtils.updateSpecPage(i, newPage)
      if (width && height) {
        resizeUtils.resizePage(i, newPage, { width, height })
      }
    }

    if (recordStep) {
      stepsUtils.record()
    }
  }

  addSvg(json: any, attrs: IAssetProps = {}) {
    const { pageIndex, styles = {} } = attrs
    const targetPageIndex = pageIndex ?? pageUtils.addAssetTargetPageIndex
    const { vSize = [] } = json
    const currentPage = this.getPage(targetPageIndex)
    const resizeRatio = RESIZE_RATIO_SVG
    const pageAspectRatio = currentPage.width / currentPage.height
    const svgAspectRatio = vSize ? ((vSize as number[])[0] / (vSize as number[])[1]) : 1
    const svgWidth = svgAspectRatio > pageAspectRatio ? currentPage.width * resizeRatio : (currentPage.height * resizeRatio) * svgAspectRatio
    const svgHeight = svgAspectRatio > pageAspectRatio ? (currentPage.width * resizeRatio) / svgAspectRatio : currentPage.height * resizeRatio
    json.ratio = 1
    json.className = ShapeUtils.classGenerator()

    const config = {
      ...json,
      styles: {
        x: currentPage.width / 2 - svgWidth / 2,
        y: currentPage.height / 2 - svgHeight / 2,
        width: svgWidth,
        height: svgHeight,
        initWidth: (vSize as number[])[0],
        initHeight: (vSize as number[])[1],
        scale: svgWidth / (vSize as number[])[0],
        color: json.color,
        vSize,
        ...styles
      }
    }
    const index = layerUtils.getObjectInsertionLayerIndex(currentPage.layers, config) + 1
    GroupUtils.deselect()
    layerUtils.addLayersToPos(targetPageIndex, [LayerFactary.newShape(config)], index)
    ZindexUtils.reassignZindex(targetPageIndex)
    GroupUtils.select(targetPageIndex, [index])
    stepsUtils.record()
  }

  async addLine(json: any, attrs: IAssetProps = {}) {
    const { pageIndex, styles = {} } = attrs
    const targetPageIndex = pageIndex ?? pageUtils.addAssetTargetPageIndex
    const oldPoint = json.point
    const { width, height } = ShapeUtils.lineDimension(oldPoint)
    const currentPage = this.getPage(targetPageIndex)
    const resizeRatio = RESIZE_RATIO_SVG
    const pageAspectRatio = currentPage.width / currentPage.height
    const svgAspectRatio = width / height
    const svgWidth = svgAspectRatio > pageAspectRatio ? currentPage.width * resizeRatio : (currentPage.height * resizeRatio) * svgAspectRatio
    const svgHeight = svgAspectRatio > pageAspectRatio ? (currentPage.width * resizeRatio) / svgAspectRatio : currentPage.height * resizeRatio
    const scaleRatio = width > 0 ? svgWidth / width : svgHeight / height
    json.ratio = 1
    await ShapeUtils.addComputableInfo(json)
    const newScale = json.size[0] * scaleRatio
    const quadrant = ShapeUtils.getLineQuadrant(json.point)
    const { point, realWidth, realHeight } = ShapeUtils.computePointForDimensions(quadrant, newScale, svgWidth, svgHeight)
    json.point = point
    const targetPos = {
      x: currentPage.width / 2 - realWidth / 2,
      y: currentPage.height / 2 - realHeight / 2
    }
    const trans = ShapeUtils.getTranslateCompensationForLineWidth(point, targetPos, json.size[0], newScale)
    json.className = ShapeUtils.classGenerator()

    const config = {
      ...json,
      size: [newScale],
      styles: {
        x: trans.x,
        y: trans.y,
        width: realWidth,
        height: realHeight,
        initWidth: realWidth,
        initHeight: realHeight,
        scale: 1,
        color: json.color,
        ...styles
      }
    }
    const index = layerUtils.getObjectInsertionLayerIndex(currentPage.layers, config) + 1
    GroupUtils.deselect()
    layerUtils.addLayersToPos(targetPageIndex, [LayerFactary.newShape(config)], index)
    ZindexUtils.reassignZindex(targetPageIndex)
    GroupUtils.select(targetPageIndex, [index])
    stepsUtils.record()
  }

  async addBasicShape(json: any, attrs: IAssetProps = {}) {
    const { pageIndex, styles = {} } = attrs
    const targetPageIndex = pageIndex ?? pageUtils.addAssetTargetPageIndex
    const { vSize = [] } = json
    const currentPage = this.getPage(targetPageIndex)
    const resizeRatio = RESIZE_RATIO_SVG
    const pageAspectRatio = currentPage.width / currentPage.height
    const svgAspectRatio = vSize[0] / vSize[1]
    const svgWidth = svgAspectRatio > pageAspectRatio ? currentPage.width * resizeRatio : (currentPage.height * resizeRatio) * svgAspectRatio
    const svgHeight = svgAspectRatio > pageAspectRatio ? (currentPage.width * resizeRatio) / svgAspectRatio : currentPage.height * resizeRatio
    const scaleRatio = svgWidth / vSize[0]
    json.ratio = 1
    await ShapeUtils.addComputableInfo(json)
    json.className = ShapeUtils.classGenerator()
    const config = {
      ...json,
      vSize: [svgWidth, svgHeight],
      size: [json.size[0] * scaleRatio, ControlUtils.getCorRadValue(
        [svgWidth, svgHeight],
        ControlUtils.getCorRadPercentage(json.vSize, json.size, json.shapeType),
        json.shapeType
      )],
      styles: {
        x: currentPage.width / 2 - svgWidth / 2,
        y: currentPage.height / 2 - svgHeight / 2,
        width: svgWidth,
        height: svgHeight,
        initWidth: svgWidth,
        initHeight: svgHeight,
        scale: 1,
        color: json.color,
        vSize,
        ...styles
      }
    }
    const index = layerUtils.getObjectInsertionLayerIndex(currentPage.layers, config) + 1
    GroupUtils.deselect()
    layerUtils.addLayersToPos(targetPageIndex, [LayerFactary.newShape(config)], index)
    ZindexUtils.reassignZindex(targetPageIndex)
    GroupUtils.select(targetPageIndex, [index])
    stepsUtils.record()
  }

  addFrame(json: any, attrs: IAssetProps = {}) {
    const { pageIndex, styles = {} } = attrs
    const targetPageIndex = pageIndex ?? pageUtils.addAssetTargetPageIndex
    const currentPage = this.getPage(targetPageIndex)
    const resizeRatio = 300 / (Math.max(json.width, json.height))
    const width = json.width * resizeRatio
    const height = json.height * resizeRatio

    const config = {
      styles: {
        x: currentPage.width / 2 - width / 2,
        y: currentPage.height / 2 - height / 2,
        width,
        height,
        initWidth: json.width,
        initHeight: json.height,
        scale: resizeRatio,
        ...styles
      },
      ...json
    }
    const index = layerUtils.getObjectInsertionLayerIndex(currentPage.layers, config) + 1
    GroupUtils.deselect()
    layerUtils.addLayersToPos(targetPageIndex, [LayerFactary.newFrame(config)], index)
    ZindexUtils.reassignZindex(targetPageIndex)
    GroupUtils.select(targetPageIndex, [index])
    // stepsUtils.record()
  }

  addBackground(url: string, attrs: IAssetProps = {}) {
    const { pageIndex, styles = {}, ver, panelPreviewSrc, imgSrcSize } = attrs
    const targetPageIndex = pageIndex ?? pageUtils.addAssetTargetPageIndex
    const { width: assetWidth = 0, height: assetHeight = 0 } = styles
    const { width: srcWidth = 0, height: srcHeight = 0 } = imgSrcSize || { width: 0, height: 0 }
    const page = store.getters.getPage(targetPageIndex)
    const { width, height, posX, posY } = ImageUtils.adaptToPage({
      width: srcWidth,
      height: srcHeight
    }, page)
    const config = LayerFactary.newImage({
      styles: {
        // width: assetWidth / 2,
        // height: assetHeight / 2,
        width: width,
        height: height,
        imgWidth: width,
        imgHeight: height,
        initWidth: width,
        initHeight: height,
        // initWidth: srcWidth,
        // initHeight: srcHeight,
        scale: 1,
        x: 200,
        y: 200
      },
      srcObj: {
        type: 'background',
        assetId: ImageUtils.getAssetId(url, 'background'),
        userId: ''
      },
      ver,
      panelPreviewSrc
    })

    store.commit('SET_backgroundImage', {
      pageIndex: targetPageIndex,
      config
    })

    store.commit('SET_backgroundImagePos', {
      pageIndex: targetPageIndex,
      imagePos: {
        x: posX,
        y: posY
      }
    })
    store.commit('SET_backgroundImageMode', {
      pageIndex: targetPageIndex,
      newDisplayMode: true
    })
    GroupUtils.deselect()
    stepsUtils.record()
  }

  async updateBackground(json: any): Promise<any> {
    if ((json.backgroundImage.config.srcObj?.assetId ?? '') !== '' && !json.backgroundImage.newDisplayMode) {
      const { width: srcWidth, height: srcHeight } = await ImageUtils.getImageSize(ImageUtils.getSrc(json.backgroundImage.config), json.backgroundImage.config.styles.width, json.backgroundImage.config.styles.height)
      const { width, height, posX, posY } = ImageUtils.adaptToSize({
        width: srcWidth,
        height: srcHeight
      }, json)
      json.backgroundImage.config.styles.imgWidth = width
      json.backgroundImage.config.styles.imgHeight = height
      json.backgroundImage.config.styles.initWidth = srcWidth
      json.backgroundImage.config.styles.initHeight = srcHeight
      json.backgroundImage.posX = posX
      json.backgroundImage.posY = posY
      json.backgroundImage.newDisplayMode = true
    }
    return json
  }

  addText(json: any, attrs: IAssetProps = {}) {
    json = generalUtils.deepCopy(json)
    const { pageIndex, has_frame, styles = {} } = attrs
    const { x, y } = styles
    const { width, height, scale } = json.styles
    const targetPageIndex = pageIndex ?? pageUtils.addAssetTargetPageIndex
    const currentPage = this.getPage(targetPageIndex)
    const resizeRatio = RESIZE_RATIO_TEXT
    const pageAspectRatio = currentPage.width / currentPage.height
    const textAspectRatio = width / height
    const textWidth = textAspectRatio > pageAspectRatio ? currentPage.width * resizeRatio : (currentPage.height * resizeRatio) * textAspectRatio
    const textHeight = textAspectRatio > pageAspectRatio ? (currentPage.width * resizeRatio) / textAspectRatio : currentPage.height * resizeRatio
    const rescaleFactor = textWidth / width

    const config = {
      ...json,
      styles: {
        ...json.styles,
        width: textWidth,
        height: textHeight,
        scale: scale * rescaleFactor
      },
      has_frame
    }

    let isCenter = false

    if (typeof y === 'undefined' || typeof x === 'undefined') {
      const { x: newX, y: newY, center } = textUtils.getAddPosition(textWidth, textHeight, targetPageIndex)
      Object.assign(
        config.styles,
        { x: newX, y: newY }
      )
      isCenter = center
    } else {
      Object.assign(
        config.styles,
        { x, y }
      )
    }

    let newLayer = null
    let isText = false

    if (config.type === 'text') {
      Object.assign(config, {
        // widthLimit: config.widthLimit === -1 ? -1 : config.widthLimit * rescaleFactor,
        widthLimit: -1, // for autoRescaleMode
        isAutoResizeNeeded: !textShapeUtils.isCurvedText(config.styles),
        inAutoRescaleMode: isCenter,
        initScale: config.styles.scale,
        // contentEditable: true
      })
      newLayer = LayerFactary.newText(config)
      const { x, y, width, height } = newLayer.styles
      const textHW = textUtils.getTextHW(newLayer, -1)
      Object.assign(newLayer.styles, {
        ...textHW,
        x: x + (width - textHW.width) / 2,
        y: y + (height - textHW.height) / 2,
      })
      isText = true
    } else if (config.type === 'group') {
      for (const subLayer of config.layers) {
        Object.assign(subLayer, {
          isAutoResizeNeeded: !textShapeUtils.isCurvedText(subLayer.styles)
        })
      }
      newLayer = LayerFactary.newGroup(config, (config as IGroup).layers)
    }

    // if (isText) {
    //   setTimeout(() => {
    //     tiptapUtils.agent(editor => editor.commands.selectAll())
    //   }, 100)
    // }

    if (newLayer !== null) {
      layerUtils.addLayers(targetPageIndex, [newLayer])
    }
  }

  async addStandardText(type: string, text?: string, locale = 'tw', pageIndex?: number, attrs: IAssetProps = {}, spanStyles: Partial<ISpanStyle> = {}) {
    const targetPageIndex = pageIndex ?? pageUtils.addAssetTargetPageIndex
    try {
      const jsonData = await import(`@/assets/json/${type}.json`)
      const fieldMap = {
        heading: 'isHeading',
        subheading: 'isSubheading',
        body: 'isBody'
      } as { [key: string]: string }
      const field = fieldMap[type]
      const textLayer = generalUtils.deepCopy(jsonData.default)
      textLayer.paragraphs[0].spans[0].text = text
      if (locale === 'tw') {
        textLayer.paragraphs[0].spans[0].styles.weight = 'normal'
      }
      textLayer.paragraphs[0].spans[0].styles.font = STANDARD_TEXT_FONT[locale]

      if (attrs.styles) {
        Object.assign(textLayer.styles, attrs.styles)
      }

      if (spanStyles) {
        Object.assign(textLayer.paragraphs[0].spans[0].styles, spanStyles)
      }

      textUtils.resetTextField(textLayer, targetPageIndex, field)
      layerUtils.addLayers(targetPageIndex, [LayerFactary.newText(Object.assign(textLayer, {
        editing: false,
        contentEditable: true,
        isCompensated: true,
        inAutoRescaleMode: true
      }))])
      editorUtils.setCloseMobilePanelFlag(true)
      setTimeout(() => {
        tiptapUtils.agent(editor => editor.commands.selectAll())
      }, 100)
    } catch (error) {
      logUtils.setLogForError(error as Error)
      console.log('Cannot find the file')
    }
  }

  addImage(url: string | SrcObj, photoAspectRatio: number, attrs: IAssetProps = {}, categoryType = -1) {
    store.commit('SET_mobileSidebarPanelOpen', false)
    const { pageIndex, isPreview, assetId: previewAssetId, assetIndex, styles, panelPreviewSrc, previewSrc } = attrs
    const pageAspectRatio = this.pageSize.width / this.pageSize.height

    let newStyles = {
      width: 0,
      height: 0,
      initWidth: 0,
      initHeight: 0,
      imgWidth: 0,
      imgHeight: 0
    } as {
      width: number, height: number, initWidth: number, initHeight: number, imgWidth: number, imgHeight: number, imgX?: number, imgY?: number
    }

    if (styles && categoryType === 14) {
      const { width: boundingWidth, height: boundingHeight } = mathUtils.getBounding(styles as IStyle)
      photoAspectRatio = boundingWidth / boundingHeight

      const photoWidth = photoAspectRatio > pageAspectRatio ? this.pageSize.width * RESIZE_RATIO_IMAGE : (this.pageSize.height * RESIZE_RATIO_IMAGE) * photoAspectRatio
      const photoHeight = photoAspectRatio > pageAspectRatio ? (this.pageSize.width * RESIZE_RATIO_IMAGE) / photoAspectRatio : this.pageSize.height * RESIZE_RATIO_IMAGE

      const { width = photoWidth, height = photoHeight, imgWidth = photoWidth, imgHeight = photoHeight, imgX = 0, imgY = 0 } = styles as IImageStyle

      const scaleRatio = photoWidth / boundingWidth

      newStyles = {
        width: width * scaleRatio,
        height: height * scaleRatio,
        initWidth: width * scaleRatio,
        initHeight: height * scaleRatio,
        imgWidth: imgWidth * scaleRatio,
        imgHeight: imgHeight * scaleRatio,
        imgX: imgX * scaleRatio,
        imgY: imgY * scaleRatio
      }
    } else {
      const photoWidth = photoAspectRatio > pageAspectRatio ? this.pageSize.width * RESIZE_RATIO_IMAGE : (this.pageSize.height * RESIZE_RATIO_IMAGE) * photoAspectRatio
      const photoHeight = photoAspectRatio > pageAspectRatio ? (this.pageSize.width * RESIZE_RATIO_IMAGE) / photoAspectRatio : this.pageSize.height * RESIZE_RATIO_IMAGE

      newStyles = {
        width: photoWidth,
        height: photoHeight,
        initWidth: photoWidth,
        initHeight: photoHeight,
        imgWidth: photoWidth,
        imgHeight: photoHeight
      }
    }

    const targetPageIndex = pageIndex ?? pageUtils.addAssetTargetPageIndex

    let srcObj
    let assetId = '' as string | number | undefined
    if (typeof url === 'string') {
      const type = ImageUtils.getSrcType(url)
      assetId = isPreview ? previewAssetId : ImageUtils.getAssetId(url, type)
      srcObj = {
        type,
        userId: ImageUtils.getUserId(url, type),
        assetId: assetIndex ?? (previewAssetId ?? ImageUtils.getAssetId(url, type)),
        brandId: ImageUtils.getBrandId(url, type)
      }
    } else {
      srcObj = url as SrcObj
    }
    const allLayers = this.getLayers(targetPageIndex)
    // Check if there is any unchanged image layer with the same asset ID
    const imageLayers = allLayers.filter((layer: IShape | IText | IImage | IGroup | ITmp) => {
      if (layer.type !== 'image') return false

      return (layer.type === 'image') && (!layer.moved) && ((layer as IImage).srcObj.assetId === assetId)
    }) as Array<IImage>

    // if so, add the image layer to the x/y pos of target layer with an constant offset(20)
    const x = imageLayers.length === 0 ? (this.pageSize.width / 2 - newStyles.width / 2) : (imageLayers[imageLayers.length - 1].styles.x + 20)
    const y = imageLayers.length === 0 ? (this.pageSize.height / 2 - newStyles.height / 2) : (imageLayers[imageLayers.length - 1].styles.y + 20)

    const config = {
      ...(previewSrc && { previewSrc }),
      ...(isPreview && { previewSrc: url }),
      ...(categoryType === 14 || categoryType === 15) && { categoryType },
      srcObj,
      panelPreviewSrc,
      styles: {
        ...styles,
        x,
        y,
        ...newStyles
      }
    }
    const index = layerUtils.getObjectInsertionLayerIndex(this.getPage(targetPageIndex).layers, config) + 1
    GroupUtils.deselect()
    layerUtils.addLayersToPos(targetPageIndex, [LayerFactary.newImage(config)], index)
    ZindexUtils.reassignZindex(targetPageIndex)
    GroupUtils.select(targetPageIndex, [index])
    stepsUtils.record()
  }

  addGroupTemplate(item: IListServiceContentDataItem, childId?: string, resize?: { width: number, height: number, physicalWidth?: number, physicalHeight?: number, unit?: string }) {
    console.log('add group template ')
    const { content_ids: contents = [], type, group_id: groupId, group_type: groupType } = item
    const currGroupType = store.getters.getGroupType
    const isDetailPage = groupType === 1 || currGroupType === 1

    store.commit('SET_groupId', groupId)
    store.commit('SET_mobileSidebarPanelOpen', false)
    // groupType: -1 normal/0 group/1 detail
    // if detail, no updates; if not, do not update to detail
    // -> update when {old, new} !== detail
    if (!isDetailPage) {
      store.commit('SET_groupType', groupType)
    }
    const promises = contents?.filter(content => childId ? content.id === childId : true)
      .map(content => this.get({ ...content, type }))
    this.addAssetToRecentlyUsed(item as any)
    return Promise.all(promises)
      .then(assets => {
        const updatePromise = assets.map(asset =>
          this.updateBackground(generalUtils.deepCopy(asset.jsonData) || {})
            .then(json => LayerFactary.newTemplate(TemplateUtils.updateTemplate(json)))
        )
        return Promise.all(updatePromise)
      })
      .then((jsonDataList: IPage[]) => {
        // 單頁: 取代, 多頁: 空白取代/加入後面
        const currFocusPage: IPage = this.getPage(pageUtils.currFocusPageIndex)
        let targetIndex = pageUtils.currFocusPageIndex
        let replace = true
        if (!childId && currFocusPage && currFocusPage.layers.length) {
          // 多頁且當前頁面非空白 => 加入在最後頁面
          targetIndex = this.getPages.length
          replace = false
        }

        // get bleeds of detail page
        let detailPageBleeds: IBleed
        if (isDetailPage) {
          detailPageBleeds = currFocusPage.physicalBleeds
          const pages = this.getPages
          detailPageBleeds = {
            ...detailPageBleeds,
            top: pages[0].physicalBleeds.top,
            bottom: pages[pages.length - 1].physicalBleeds.bottom,
          } as IBleed
        }

        // pageUtils.setAutoResizeNeededForPages(jsonDataList, true)
        layerUtils.setAutoResizeNeededForLayersInPages(jsonDataList, true)
        pageUtils.appendPagesTo(jsonDataList, targetIndex, replace)
        nextTick(() => {
          pageUtils.scrollIntoPage(targetIndex)
          // @TODO: resize page/layer before adding to the store.
          if (resize) resizeUtils.resizePage(targetIndex, this.getPage(targetIndex), resize)
          if (isDetailPage && !resize) {
            // 電商詳情頁模板 + 全部加入 = 所有寬度設為1000
            const { width: pageWidth = 1000, physicalWidth: pagePhysicalWidth = pageWidth, unit: pageUnit = 'px' } = this.getPage(pageUtils.currFocusPageIndex)
            const precision = pageUnit === 'px' ? 0 : PRECISION
            for (const idx in jsonDataList) {
              const { height, width, physicalWidth = width, physicalHeight = height, unit = 'px' } = jsonDataList[idx]
              const templateSize = unitUtils.convertSize(physicalWidth, physicalHeight, unit, pageUnit)
              const pageIndex = +idx + targetIndex
              const newPhysicalSize = { physicalHeight: round(templateSize.height * pagePhysicalWidth / templateSize.width, precision), physicalWidth: pagePhysicalWidth }
              const newPxSize = { height: round(height * pageWidth / width), width: pageWidth }
              resizeUtils.resizePage(pageIndex, this.getPage(pageIndex), {
                ...newPxSize,
                ...newPhysicalSize,
                unit: pageUnit
              })
            }
          }

          // apply bleeds of currFocusPage
          if ((resize && Object.keys(resize).length > 0) || isDetailPage) {
            let physicalBleeds
            if (currFocusPage.bleeds && currFocusPage.physicalBleeds) {
              // convert bleeds to template unit
              physicalBleeds = isDetailPage ? detailPageBleeds : currFocusPage.physicalBleeds
              const dpi = pageUtils.getPageDPI(currFocusPage)
              const unit = resize?.unit ?? (isDetailPage ? currFocusPage.unit : jsonDataList[0]?.unit) ?? 'px'
              if (currFocusPage.unit !== unit) physicalBleeds = Object.fromEntries(Object.entries(physicalBleeds).map(([k, v]) => [k, unitUtils.convert(v, currFocusPage.unit, unit, k === 'left' || k === 'right' ? dpi.width : dpi.height)])) as IBleed
            }
            for (const idx in jsonDataList) {
              const pageIndex = +idx + targetIndex
              pageUtils.setIsEnableBleed(!!currFocusPage.isEnableBleed, pageIndex)
              if (!physicalBleeds) continue

              let newPhysicalBleeds: IBleed = physicalBleeds
              if (isDetailPage) {
                newPhysicalBleeds = {
                  ...newPhysicalBleeds,
                  top: pageIndex === 0 ? physicalBleeds.top : 0,
                  bottom: pageIndex === (this.getPages.length - 1) ? physicalBleeds.bottom : 0,
                }
              }
              pageUtils.setBleeds(pageIndex, newPhysicalBleeds)
            }

            // remove bottom bleed if template is add to last page
            if (isDetailPage && !replace) pageUtils.setBleeds(targetIndex - 1, { ...this.getPage(targetIndex - 1).physicalBleeds, bottom: 0 })

            backgroundUtils.fitPageBackground(targetIndex)
          }
          store.commit('SET_currActivePageIndex', targetIndex)
          stepsUtils.record()

          // Close MobilePanel and fit in
          if (generalUtils.isTouchDevice()) {
            editorUtils.setCloseMobilePanelFlag(true)
          }
        })
      })
  }

  async addAsset(item: IListServiceContentDataItem, attrs: IAssetProps = {}, moduleKey?: string) {
    try {
      store.commit('SET_mobileSidebarPanelOpen', false)
      let key = ''
      const asset = await this.get(item, attrs.db) as IAsset

      switch (asset.type) {
        case 1: {
          if (!attrs.imgSrcSize?.width || !attrs.imgSrcSize.height) {
            attrs.imgSrcSize = await ImageUtils.getImageSize(ImageUtils.getSrc({
              srcObj: {
                type: 'background',
                assetId: ImageUtils.getAssetId(asset.urls.prev, 'background'),
                userId: ''
              }
            }, 'prev', attrs.ver), asset.width ?? 0, asset.height ?? 0)
          }
          this.addBackground(
            asset.urls.prev,
            { ...attrs, styles: { width: asset.width, height: asset.height }, ver: item.ver }
          )
          break
        }
        case 5:
        case 9:
          this.addSvg({ ...asset.jsonData, designId: item.id, db: 'svg' }, attrs)
          key = 'objects'
          break
        case 6:
          gtmUtils.trackTemplateDownload(item.id)
          await this.addTemplate(asset.jsonData, attrs)
          break
        case 7:
          this.addText({ ...asset.jsonData, designId: item.id, db: 'text' }, attrs)
          key = 'textStock'
          break
        case 8:
          this.addFrame({ ...asset.jsonData, designId: item.id }, attrs)
          key = 'objects'
          break
        case 10:
          await this.addLine(asset.jsonData, attrs)
          key = 'objects'
          break
        case 11:
          await this.addBasicShape(asset.jsonData, attrs)
          key = 'objects'
          break
        case 14: {
          switch ((asset.jsonData as any).type) {
            case 'image': {
              const { srcObj, styles } = asset.jsonData as IImage
              this.addImage(srcObj, styles.width / styles.height, { styles }, 14)
              key = 'objects'
              break
            }
            case 'group':
              this.addText({ ...asset.jsonData, designId: item.id }, attrs)
              key = 'textStock'
          }
          break
        }
        case 15: {
          this.addImage(asset.urls.prev, (asset.width ?? 1) / (asset.height ?? 1), {}, 15)
          key = 'objects'
          break
        }
        default:
          throw new Error(`"${asset.type}" is not a type of asset`)
      }
      key = moduleKey ?? key
      editorUtils.setCloseMobilePanelFlag(true)
      this.addAssetToRecentlyUsed(asset, key)
      return asset.jsonData
    } catch (error) {
      logUtils.setLogForError(error as Error)
      captureException(error)
    }
  }

  addAssetToRecentlyUsed(asset: IAsset, key?: string, db?: string) {
    const {
      id, type, width, height, plan,
      content_ids: contentIds, match_cover: matchCover,
      user_id: userId, asset_id: assetId, asset_index: assetIndex_,
      src, ver, signed_url: signedUrl
    } = asset
    const item = {
      id,
      plan,
      type,
      width,
      height,
      content_ids: contentIds,
      match_cover: matchCover,
      src,
      user_id: userId,
      asset_id: assetId,
      asset_index: assetIndex_,
      signed_url: signedUrl,
      ver
    }
    const typeCategory = db ?? this.getTypeCategory(type)
    const typeModule = key ?? this.getTypeModule(type)
    if (typeCategory && typeModule) {
      // @TODO 手動加入最近使用
      const categories = generalUtils.deepCopy((store.state as any)[typeModule].categories)
      const recentlyUsed = categories.find((category: IListServiceContentData) => category.is_recent === 1)
      if (recentlyUsed) {
        const assetIndex = recentlyUsed.list.findIndex((asset: IListServiceContentDataItem) => asset.id === id)
        if (assetIndex >= 0) {
          recentlyUsed.list.splice(assetIndex, 1)
        }
        recentlyUsed.list.unshift(item)
        store.commit(`${typeModule}/SET_STATE`, { categories })
      }
      if (key) vivistickerUtils.addAsset(key, item)
      const params = {} as { [key: string]: any }
      if (typeCategory === 'font') {
        params.is_asset = (src === 'private' || src === 'admin') ? 1 : 0
      }
      listApi.addDesign(id, typeCategory, params)
    }
  }

  addTemplateToRecentlyUsedPure(id: string): Promise<any> {
    return listApi.addDesign(id, 'template')
  }

  setRecentlyUsed(typeModule: string, recentlyUsedList: any[]) {
    if (typeModule === 'color') {
      const recently = recentlyUsedList.map(({ id }: { id: string }) => `#${id}`)
      store.commit(`${typeModule}/SET_recentlyColors`, recently)
    } else if (typeModule === 'backgroundColor') {
      const recently = recentlyUsedList.map(({ id }: { id: string }) => `#${id}`)
      store.commit('vivisticker/SET_recentlyBgColors', recently)
    } else {
      const categories = generalUtils.deepCopy((store.state as any)[typeModule].categories)
      const recentlyUsed = categories.find((category: IListServiceContentData) => category.is_recent === 1)
      if (recentlyUsed) {
        recentlyUsed.list = recentlyUsedList
        store.commit(`${typeModule}/SET_STATE`, { categories })
      }
    }
  }
}

export default new AssetUtils()
