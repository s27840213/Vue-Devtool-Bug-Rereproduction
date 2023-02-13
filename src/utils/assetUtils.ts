import listApi from '@/apis/list'
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import { SrcObj } from '@/interfaces/gallery'
import { IGroup, IImage, IImageStyle, IShape, ISpanStyle, IStyle, IText, ITmp } from '@/interfaces/layer'
import { IAsset, IAssetProps } from '@/interfaces/module'
import { IBleed, IPage } from '@/interfaces/page'
import store from '@/store'
import { notify } from '@kyvg/vue3-notification'
import { captureException } from '@sentry/browser'
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
import LayerUtils from './layerUtils'
import mathUtils from './mathUtils'
import pageUtils from './pageUtils'
import resizeUtils from './resizeUtils'
import ShapeUtils from './shapeUtils'
import stepsUtils from './stepsUtils'
import TemplateUtils from './templateUtils'
import TextUtils from './textUtils'
import tiptapUtils from './tiptapUtils'
import unitUtils from './unitUtils'
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
    const asset = this.getAsset(item.id)
    return (asset && asset.ver === item.ver) ? Promise.resolve(generalUtils.deepCopy(asset)) : this.fetch(item, db)
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
    const targetPageIndex = attrs?.pageIndex ?? pageUtils.addAssetTargetPageIndex
    const targetPage: IPage = this.getPage(targetPageIndex)
    json = await this.updateBackground(generalUtils.deepCopy(json))
    pageUtils.setAutoResizeNeededForPage(json, true)
    const newLayer = LayerFactary.newTemplate(TemplateUtils.updateTemplate(json))
    pageUtils.updateSpecPage(targetPageIndex, newLayer)
    if (attrs?.width && attrs?.height) resizeUtils.resizePage(targetPageIndex, newLayer, { width: attrs.width, height: attrs.height, physicalWidth: attrs.physicalWidth, physicalHeight: attrs.physicalHeight, unit: attrs.unit })

    if (store.getters['user/getUserId'] === 'backendRendering') {
      const { isBleed, isTrim } = store.getters['user/getBackendRenderParams']
      if (isBleed || isTrim) {
        pageUtils.setIsEnableBleed(true, targetPageIndex)
        if (json.bleeds && json.physicalBleeds) pageUtils.setBleeds(targetPageIndex, json.physicalBleeds, json.bleeds) // use bleeds of page if it has
      } else pageUtils.setIsEnableBleed(false, targetPageIndex)
    } else if (attrs && Object.keys(attrs).length > 0) { // use page size
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
      pageUtils.setAutoResizeNeededForPage(json, true)
      const newLayer = LayerFactary.newTemplate(TemplateUtils.updateTemplate(json))
      pageUtils.updateSpecPage(i, newLayer)
      if (width && height) {
        resizeUtils.resizePage(i, newLayer, { width, height })
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
    const index = LayerUtils.getObjectInsertionLayerIndex(currentPage.layers, config) + 1
    GroupUtils.deselect()
    LayerUtils.addLayersToPos(targetPageIndex, [LayerFactary.newShape(config)], index)
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
    json.ratio = 1
    await ShapeUtils.addComputableInfo(json)
    const quadrant = ShapeUtils.getLineQuadrant(json.point)
    const { point, realWidth, realHeight } = ShapeUtils.computePointForDimensions(quadrant, json.size[0], svgWidth, svgHeight)
    json.point = point
    json.className = ShapeUtils.classGenerator()

    const config = {
      ...json,
      styles: {
        x: currentPage.width / 2 - realWidth / 2,
        y: currentPage.height / 2 - realHeight / 2,
        width: realWidth,
        height: realHeight,
        initWidth: realWidth,
        initHeight: realHeight,
        scale: 1,
        color: json.color,
        ...styles
      }
    }
    const index = LayerUtils.getObjectInsertionLayerIndex(currentPage.layers, config) + 1
    GroupUtils.deselect()
    LayerUtils.addLayersToPos(targetPageIndex, [LayerFactary.newShape(config)], index)
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
    const svgAspectRatio = vSize ? ((vSize as number[])[0] / (vSize as number[])[1]) : 1
    const svgWidth = svgAspectRatio > pageAspectRatio ? currentPage.width * resizeRatio : (currentPage.height * resizeRatio) * svgAspectRatio
    const svgHeight = svgAspectRatio > pageAspectRatio ? (currentPage.width * resizeRatio) / svgAspectRatio : currentPage.height * resizeRatio
    json.ratio = 1
    await ShapeUtils.addComputableInfo(json)
    json.className = ShapeUtils.classGenerator()
    const config = {
      ...json,
      vSize: [svgWidth, svgHeight],
      size: [json.size[0], ControlUtils.getCorRadValue(
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
    const index = LayerUtils.getObjectInsertionLayerIndex(currentPage.layers, config) + 1
    GroupUtils.deselect()
    LayerUtils.addLayersToPos(targetPageIndex, [LayerFactary.newShape(config)], index)
    ZindexUtils.reassignZindex(targetPageIndex)
    GroupUtils.select(targetPageIndex, [index])
    stepsUtils.record()
  }

  addFrame(json: any, attrs: IAssetProps = {}) {
    const { pageIndex, styles = {} } = attrs
    const targetPageIndex = pageIndex ?? pageUtils.addAssetTargetPageIndex
    const currentPage = this.getPage(targetPageIndex) as IPage
    const svgRatio = json.width / json.height
    const resizeRatio = ((svgRatio > 1 ? currentPage.width : currentPage.height) * 0.7) / (svgRatio > 1 ? json.width : json.height)
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
    const index = LayerUtils.getObjectInsertionLayerIndex(currentPage.layers, config) + 1
    GroupUtils.deselect()
    LayerUtils.addLayersToPos(targetPageIndex, [LayerFactary.newFrame(config)], index)
    ZindexUtils.reassignZindex(targetPageIndex)
    GroupUtils.select(targetPageIndex, [index])
    stepsUtils.record()
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
    const { pageIndex, styles = {} } = attrs
    const { x, y } = styles
    const { width, height, scale } = json.styles
    const targetPageIndex = pageIndex ?? pageUtils.addAssetTargetPageIndex
    const currentPage = this.getPage(targetPageIndex)
    const resizeRatio = RESIZE_RATIO_TEXT
    const pageAspectRatio = currentPage.width / currentPage.height
    const textAspectRatio = width / height
    const textWidth = textAspectRatio > pageAspectRatio ? currentPage.width * resizeRatio : (currentPage.height * resizeRatio) * textAspectRatio
    const textHeight = textAspectRatio > pageAspectRatio ? (currentPage.width * resizeRatio) / textAspectRatio : currentPage.height * resizeRatio

    const config = {
      ...json,
      widthLimit: json.widthLimit === -1 ? -1 : json.widthLimit * (textWidth / width),
      styles: {
        ...json.styles,
        width: textWidth,
        height: textHeight,
        scale: scale * (textWidth / width)
      }
    }
    Object.assign(
      config.styles,
      typeof y === 'undefined' || typeof x === 'undefined'
        ? TextUtils.getAddPosition(textWidth, textHeight, targetPageIndex)
        : { x, y }
    )
    const newLayer = config.type === 'group'
      ? LayerFactary.newGroup(config, (config as IGroup).layers)
      : LayerFactary.newText(config)
    LayerUtils.addLayers(targetPageIndex, [newLayer])
  }

  addStandardText(type: string, text?: string, locale = 'tw', pageIndex?: number, attrs: IAssetProps = {}, spanStyles: Partial<ISpanStyle> = {}) {
    const targetPageIndex = pageIndex ?? pageUtils.addAssetTargetPageIndex
    return import(`@/assets/json/${type}.json`)
      .then(jsonData => {
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

        TextUtils.resetTextField(textLayer, targetPageIndex, field)
        LayerUtils.addLayers(targetPageIndex, [LayerFactary.newText(Object.assign(textLayer, { editing: false, contentEditable: true }))])
        editorUtils.setCloseMobilePanelFlag(true)
        setTimeout(() => {
          tiptapUtils.agent(editor => editor.commands.selectAll())
        }, 100)
      })
      .catch(() => {
        console.log('Cannot find the file')
      })
  }

  addImage(url: string | SrcObj, photoAspectRatio: number, attrs: IAssetProps = {}, categoryType = -1) {
    store.commit('SET_mobileSidebarPanelOpen', false)
    const { pageIndex, isPreview, assetId: previewAssetId, assetIndex, styles, panelPreviewSrc } = attrs
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
      const { width: boundingWidth, height: boundingHeight } = mathUtils.getBounding({ styles: styles as IStyle })
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
      ...(isPreview && { previewSrc: url }),
      srcObj,
      panelPreviewSrc,
      styles: {
        ...styles,
        x,
        y,
        ...newStyles
      }
    }
    const index = LayerUtils.getObjectInsertionLayerIndex(this.getPage(targetPageIndex).layers, config) + 1
    GroupUtils.deselect()
    LayerUtils.addLayersToPos(targetPageIndex, [LayerFactary.newImage(config)], index)
    ZindexUtils.reassignZindex(targetPageIndex)
    GroupUtils.select(targetPageIndex, [index])
    stepsUtils.record()
  }

  addGroupTemplate(item: IListServiceContentDataItem, childId?: string, resize?: { width: number, height: number, physicalWidth?: number, physicalHeight?: number, unit?: string }) {
    const { content_ids: contents = [], type, group_id: groupId, group_type: groupType } = item
    const currGroupType = store.getters.getGroupType
    store.commit('SET_groupId', groupId)
    store.commit('SET_mobileSidebarPanelOpen', false)
    // groupType: -1 normal/0 group/1 detail
    // if detail, no updates; if not, do not update to detail
    // -> update when {old, new} !== detail
    if (currGroupType !== 1 && groupType !== 1) {
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
      .then(jsonDataList => {
        // 單頁: 取代, 多頁: 空白取代/加入後面
        const currFocusPage: IPage = this.getPage(pageUtils.currFocusPageIndex)
        let targetIndex = pageUtils.currFocusPageIndex
        let replace = true
        if (!childId && currFocusPage && currFocusPage.layers.length) {
          // 多頁且當前頁面非空白 => 加入在最後頁面
          targetIndex = this.getPages.length
          replace = false
        }
        pageUtils.setAutoResizeNeededForPages(jsonDataList, true)
        pageUtils.appendPagesTo(jsonDataList, targetIndex, replace)
        nextTick(() => {
          pageUtils.scrollIntoPage(targetIndex)
          // @TODO: resize page/layer before adding to the store.
          if (resize) resizeUtils.resizePage(targetIndex, this.getPage(targetIndex), resize)
          if ((groupType === 1 || currGroupType === 1) && !resize) {
            // 電商詳情頁模板 + 全部加入 = 所有寬度設為1000
            const { width: pageWidth = 1000 } = pageUtils.getPageWidth()
            for (const idx in jsonDataList) {
              const { height, width } = jsonDataList[idx]
              const pageIndex = +idx + targetIndex
              const newSize = { height: height * pageWidth / width, width: pageWidth }
              resizeUtils.resizePage(pageIndex, this.getPage(pageIndex), newSize)
            }
          }

          // apply bleeds of currFocusPage
          if (resize && Object.keys(resize).length > 0) {
            let physicalBleeds
            if (currFocusPage.bleeds && currFocusPage.physicalBleeds) {
              // convert bleeds to template unit
              const dpi = pageUtils.getPageDPI(currFocusPage)
              const unit = resize?.unit ?? jsonDataList[0]?.unit ?? 'px'
              physicalBleeds = currFocusPage.unit === unit ? currFocusPage.physicalBleeds
                : Object.fromEntries(Object.entries(currFocusPage.physicalBleeds).map(([k, v]) => [k, unitUtils.convert(v, currFocusPage.unit, unit, k === 'left' || k === 'right' ? dpi.width : dpi.height)])) as IBleed
            }
            for (const idx in jsonDataList) {
              const pageIndex = +idx + targetIndex
              pageUtils.setIsEnableBleed(!!currFocusPage.isEnableBleed, pageIndex)
              if (physicalBleeds) pageUtils.setBleeds(pageIndex, physicalBleeds)
            }
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

  async addAsset(item: IListServiceContentDataItem, attrs: IAssetProps = {}) {
    try {
      store.commit('SET_mobileSidebarPanelOpen', false)
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
          break
        case 6:
          gtmUtils.trackTemplateDownload(item.id)
          this.addTemplate(asset.jsonData, attrs)
          // this.addTemplateToAllPages(asset.jsonData, attrs)
          break
        case 7:
          this.addText({ ...asset.jsonData, designId: item.id }, attrs)
          break
        case 8:
          this.addFrame({ ...asset.jsonData, designId: item.id }, attrs)
          break
        case 10:
          this.addLine(asset.jsonData, attrs)
          break
        case 11:
          this.addBasicShape(asset.jsonData, attrs)
          break
        case 14: {
          switch ((asset.jsonData as any).type) {
            case 'image': {
              const { srcObj, styles } = asset.jsonData as IImage
              this.addImage(srcObj, styles.width / styles.height, { styles }, 14)
              break
            }
            case 'group':
              this.addText({ ...asset.jsonData, designId: item.id }, attrs)
          }
          break
        }
        case 15: {
          this.addImage(asset.urls.prev, (asset.width ?? 1) / (asset.height ?? 1))
          break
        }
        default:
          throw new Error(`"${asset.type}" is not a type of asset`)
      }
      editorUtils.setCloseMobilePanelFlag(true)
      this.addAssetToRecentlyUsed(asset)
    } catch (error) {
      console.error(error)
      captureException(error)
    }
  }

  addAssetToRecentlyUsed(asset: IAsset) {
    const {
      id, type, width, height, plan,
      content_ids: contentIds, match_cover: matchCover,
      user_id: userId, asset_id: assetId, asset_index: assetIndex_,
      src, ver, signed_url: signedUrl
    } = asset
    const typeCategory = this.getTypeCategory(type)
    const typeModule = this.getTypeModule(type)
    if (typeCategory && typeModule) {
      // @TODO 手動加入最近使用
      const categories = generalUtils.deepCopy((store.state as any)[typeModule].categories)
      const recentlyUsed = categories.find((category: IListServiceContentData) => category.is_recent === 1)
      if (recentlyUsed) {
        const assetIndex = recentlyUsed.list.findIndex((asset: IListServiceContentDataItem) => asset.id === id)
        if (assetIndex >= 0) {
          recentlyUsed.list.splice(assetIndex, 1)
        }
        recentlyUsed.list.unshift({
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
        })
        store.commit(`${typeModule}/SET_STATE`, { categories })
      }
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
}

export default new AssetUtils()
