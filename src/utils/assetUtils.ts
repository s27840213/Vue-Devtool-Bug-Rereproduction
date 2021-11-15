import Vue from 'vue'
import { captureException } from '@sentry/browser'
import store from '@/store'
import { IListServiceContentDataItem, IListServiceContentData, IAssetPhoto } from '@/interfaces/api'
import { IAsset, IAssetProps } from '@/interfaces/module'
import TemplateUtils from './templateUtils'
import PageUtils from './pageUtils'
import ShapeUtils from './shapeUtils'
import LayerUtils from './layerUtils'
import LayerFactary from './layerFactary'
import GeneralUtils from './generalUtils'
import ImageUtils from './imageUtils'
import { IGroup, IImage, IShape, IText, ITmp } from '@/interfaces/layer'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import TextUtils from './textUtils'
import ControlUtils from './controlUtils'
import listApi from '@/apis/list'
import uploadUtils from './uploadUtils'
import stepsUtils from './stepsUtils'

class AssetUtils {
  host = 'https://template.vivipic.com'
  data = 'config.json'
  preview = 'prev'

  get getAsset() { return store.getters.getAsset }
  get getPage() { return store.getters.getPage }
  get pageSize() { return store.getters.getPageSize(PageUtils.currFocusPageIndex) }
  get getLayer() { return store.getters.getLayer }
  get layerIndex() { return store.getters.getCurrSelectedIndex }
  get lastSelectedPageIndex() { return store.getters.getLastSelectedPageIndex }
  get getLayers() { return store.getters.getLayers }
  get getPages() { return store.getters.getPages }

  get(item: IListServiceContentDataItem): IAsset {
    const asset = this.getAsset(item.id)
    return (asset && asset.ver === item.ver) ? GeneralUtils.deepCopy(asset) : this.fetch(item)
  }

  getTypeCategory(type: number): string | undefined {
    // @TODO 暫時
    const typeStrMap = {
      0: 'font',
      1: 'background',
      6: 'template',
      7: 'text',
      5: 'svg',
      8: 'svg',
      9: 'svg',
      10: 'svg',
      11: 'svg'
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
      9: 'objects'
    } as { [key: number]: string }
    return typeModuleMap[type]
  }

  fetch(item: IListServiceContentDataItem): Promise<IAsset> {
    const { id, type, ver, ...attrs } = item
    const typeCategory = this.getTypeCategory(type)
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
      default: {
        return fetch(asset.urls.json + `?ver=${ver}`)
          .then(response => response.json())
          .then(jsonData => {
            asset.jsonData = jsonData
            store.commit('SET_assetJson', { [id]: asset })
            return asset
          })
      }
    }
  }

  addTemplate(json: any, attrs: IAssetProps = {}) {
    const { pageIndex } = attrs
    const targePageIndex = pageIndex || this.lastSelectedPageIndex
    this.updateBackground(json).then((json) => {
      PageUtils.updateSpecPage(targePageIndex, LayerFactary.newTemplate(TemplateUtils.updateTemplate(json)))
      stepsUtils.record()
    })
  }

  addSvg(json: any, attrs: IAssetProps = {}) {
    console.log(json)
    console.log(attrs)
    const { pageIndex, styles = {} } = attrs
    const targePageIndex = pageIndex || this.lastSelectedPageIndex
    const { vSize = [] } = json
    const currentPage = this.getPage(targePageIndex)
    const resizeRatio = 0.55
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
    LayerUtils.addLayers(targePageIndex, [LayerFactary.newShape(config)])
  }

  async addLine(json: any, attrs: IAssetProps = {}) {
    const { pageIndex, styles = {} } = attrs
    const targePageIndex = pageIndex || this.lastSelectedPageIndex
    const oldPoint = json.point
    const { width, height } = ShapeUtils.lineDimension(oldPoint)
    const currentPage = this.getPage(targePageIndex)
    const resizeRatio = 0.55
    const pageAspectRatio = currentPage.width / currentPage.height
    const svgAspectRatio = width / height
    const svgWidth = svgAspectRatio > pageAspectRatio ? currentPage.width * resizeRatio : (currentPage.height * resizeRatio) * svgAspectRatio
    const svgHeight = svgAspectRatio > pageAspectRatio ? (currentPage.width * resizeRatio) / svgAspectRatio : currentPage.height * resizeRatio
    json.ratio = 1
    await ShapeUtils.addComputableInfo(json)
    const quadrant = ShapeUtils.getLineQuadrant(json.point)
    const { point, realWidth, realHeight } = ShapeUtils.computePointForDimensions(quadrant, json.size[0], svgWidth, svgHeight)
    json.point = point

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
    LayerUtils.addLayers(targePageIndex, [LayerFactary.newShape(config)])
  }

  async addBasicShape(json: any, attrs: IAssetProps = {}) {
    const { pageIndex, styles = {} } = attrs
    const targePageIndex = pageIndex || this.lastSelectedPageIndex
    const { vSize = [] } = json
    const currentPage = this.getPage(targePageIndex)
    const resizeRatio = 0.55
    const pageAspectRatio = currentPage.width / currentPage.height
    const svgAspectRatio = vSize ? ((vSize as number[])[0] / (vSize as number[])[1]) : 1
    const svgWidth = svgAspectRatio > pageAspectRatio ? currentPage.width * resizeRatio : (currentPage.height * resizeRatio) * svgAspectRatio
    const svgHeight = svgAspectRatio > pageAspectRatio ? (currentPage.width * resizeRatio) / svgAspectRatio : currentPage.height * resizeRatio
    json.ratio = 1
    await ShapeUtils.addComputableInfo(json)

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
    LayerUtils.addLayers(targePageIndex, [LayerFactary.newShape(config)])
  }

  addFrame(json: any, attrs: IAssetProps = {}) {
    const { pageIndex, styles = {} } = attrs
    const targePageIndex = pageIndex || this.lastSelectedPageIndex
    const currentPage = this.getPage(targePageIndex)
    const resizeRatio = 0.6
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
    LayerUtils.addLayers(targePageIndex, [LayerFactary.newFrame(config)])
  }

  addBackground(url: string, attrs: IAssetProps = {}, imageSize: { width: number, height: number }) {
    const { pageIndex, styles = {} } = attrs
    const targetPageIndex = pageIndex || this.lastSelectedPageIndex
    const { width: assetWidth = 0, height: assetHeight = 0 } = styles
    const { width: srcWidth = 0, height: srcHeight = 0 } = imageSize
    const page = store.getters.getPage(targetPageIndex)
    const { width, height, posX, posY } = ImageUtils.adaptToSize({
      width: srcWidth,
      height: srcHeight
    }, page)
    const config = LayerFactary.newImage({
      styles: {
        width: assetWidth / 2,
        height: assetHeight / 2,
        imgWidth: width,
        imgHeight: height,
        initWidth: srcWidth,
        initHeight: srcHeight,
        x: 200,
        y: 200
      },
      srcObj: {
        type: 'background',
        assetId: ImageUtils.getAssetId(url, 'background'),
        userId: ''
      }
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
    const { pageIndex, styles = {} } = attrs
    const { x, y } = styles
    const { width, height } = json.styles
    const targePageIndex = pageIndex || this.lastSelectedPageIndex
    const config = {
      ...json,
      styles: {
        ...json.styles
      }
    }
    Object.assign(
      config.styles,
      typeof y === 'undefined' || typeof x === 'undefined'
        ? TextUtils.getAddPosition(width, height, targePageIndex)
        : { x, y }
    )
    const newLayer = config.type === 'group'
      ? LayerFactary.newGroup((config.styles as ICalculatedGroupStyle), (config as IGroup).layers)
      : LayerFactary.newText(config)
    LayerUtils.addLayers(targePageIndex, [newLayer])
  }

  addStanardText(type: string, pageIndex?: number) {
    const targePageIndex = pageIndex || this.lastSelectedPageIndex
    return import(`@/assets/json/${type}.json`)
      .then(jsonData => {
        const fieldMap = {
          heading: 'isHeading',
          subheading: 'isSubheading',
          body: 'isBody'
        } as { [key: string]: string }
        const field = fieldMap[type]
        const textLayer = GeneralUtils.deepCopy(jsonData.default)
        TextUtils.resetTextField(textLayer, targePageIndex, field)
        LayerUtils.addLayers(targePageIndex, [LayerFactary.newText(Object.assign(textLayer, { editing: true }))])
      })
      .catch(() => {
        console.log('Cannot find the file')
      })
  }

  addImage(url: string, photoAspectRatio: number, attrs: IAssetProps = {}) {
    const { pageIndex, isPreview, assetId: previewAssetId } = attrs
    const resizeRatio = 0.8
    const pageAspectRatio = this.pageSize.width / this.pageSize.height
    const photoWidth = photoAspectRatio > pageAspectRatio ? this.pageSize.width * resizeRatio : (this.pageSize.height * resizeRatio) * photoAspectRatio
    const photoHeight = photoAspectRatio > pageAspectRatio ? (this.pageSize.width * resizeRatio) / photoAspectRatio : this.pageSize.height * resizeRatio

    const allLayers = this.getLayers(this.lastSelectedPageIndex)
    const type = ImageUtils.getSrcType(url)
    const assetId = isPreview ? previewAssetId : ImageUtils.getAssetId(url, type)

    // Check if there is any unchanged image layer with the same asset ID
    const imageLayers = allLayers.filter((layer: IShape | IText | IImage | IGroup | ITmp) => {
      if (layer.type !== 'image') return false

      return (layer.type === 'image') && (!layer.moved) && ((layer as IImage).srcObj.assetId === assetId)
    }) as Array<IImage>

    // if so, add the image layer to the x/y pos of target layer with an constant offset(20)
    const x = imageLayers.length === 0 ? this.pageSize.width / 2 - photoWidth / 2 : imageLayers[imageLayers.length - 1].styles.x + 20
    const y = imageLayers.length === 0 ? this.pageSize.height / 2 - photoHeight / 2 : imageLayers[imageLayers.length - 1].styles.y + 20

    const targePageIndex = pageIndex || this.lastSelectedPageIndex

    const config = {
      ...(isPreview && { previewSrc: url }),
      srcObj: {
        type,
        userId: ImageUtils.getUserId(url, type),
        assetId: previewAssetId ?? ImageUtils.getAssetId(url, type)
      },
      styles: {
        x,
        y,
        width: photoWidth,
        height: photoHeight,
        initWidth: photoWidth,
        initHeight: photoHeight,
        imgWidth: photoWidth,
        imgHeight: photoHeight
      }
    }
    LayerUtils.addLayers(targePageIndex, [LayerFactary.newImage(config)])
  }

  async addGroupTemplate (item: IListServiceContentDataItem) {
    const { content_ids: contents = [], type } = item
    const lastPageIndex = this.getPages.length
    const promises = contents?.map(content => this.get({ ...content, type }))
    this.addAssetToRecentlyUsed(item as any)
    Promise.all(promises)
      .then(assets => {
        const updatePromise = assets.map(asset =>
          this.updateBackground(asset.jsonData || {})
            .then(json => LayerFactary.newTemplate(TemplateUtils.updateTemplate(json)))
        )
        return Promise.all(updatePromise)
      })
      .then(jsonDataList => {
        PageUtils.appendPagesTo(jsonDataList, lastPageIndex)
        stepsUtils.record()
        Vue.nextTick(() => {
          PageUtils.scrollIntoPage(lastPageIndex)
        })
      })
  }

  async addAsset(item: IListServiceContentDataItem, attrs: IAssetProps = {}) {
    try {
      console.log('item ID: ' + item.id)
      console.log(item)
      const asset = await this.get(item) as IAsset
      switch (asset.type) {
        case 7:
          this.addText(asset.jsonData, attrs)
          break
        case 6:
          this.addTemplate(asset.jsonData, attrs)
          break
        case 5:
        case 9:
          this.addSvg(Object.assign(asset.jsonData, { designId: item.id }), attrs)
          break
        case 10:
          this.addLine(asset.jsonData, attrs)
          break
        case 11:
          this.addBasicShape(asset.jsonData, attrs)
          break
        case 1:
          this.addBackground(
            asset.urls.prev,
            { ...attrs, styles: { width: asset.width, height: asset.height } },
            await ImageUtils.getImageSize(asset.urls.full, asset.width ?? 0, asset.height ?? 0)
          )
          break
        case 8:
          this.addFrame(Object.assign(asset.jsonData, { designId: item.id }), attrs)
          break
        default:
          throw new Error(`"${asset.type}" is not a type of asset`)
      }
      this.addAssetToRecentlyUsed(asset)
    } catch (error) {
      console.log(error)
      captureException(error)
    }
  }

  addAssetToRecentlyUsed(asset: IAsset) {
    const { id, type, width, height } = asset
    const typeCategory = this.getTypeCategory(type)
    const typeModule = this.getTypeModule(type)
    if (typeCategory && typeModule) {
      // @TODO 手動加入最近使用
      const categories = GeneralUtils.deepCopy((store.state as any)[typeModule].categories)
      const recentlyUsed = categories.find((category: IListServiceContentData) => category.title.includes('最近使用的項目'))
      if (recentlyUsed) {
        const assetIndex = recentlyUsed.list.findIndex((asset: IListServiceContentDataItem) => asset.id === id)
        if (assetIndex >= 0) {
          recentlyUsed.list.splice(assetIndex, 1)
        }
        recentlyUsed.list.unshift({
          id,
          type,
          width,
          height,
          content_ids: asset.content_ids,
          match_cover: asset.match_cover
        })
        store.commit(`${typeModule}/SET_STATE`, { categories })
      }
      listApi.addDesign(id, typeCategory)
    }
  }
}

export default new AssetUtils()
