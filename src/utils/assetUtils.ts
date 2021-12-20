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
import TextUtils from './textUtils'
import ControlUtils from './controlUtils'
import listApi from '@/apis/list'
import stepsUtils from './stepsUtils'
import ZindexUtils from './zindexUtils'
import resizeUtils from './resizeUtils'
import { IPage } from '@/interfaces/page'

const STANDARD_TEXT_FONT: { [key: string]: string } = {
  tw: 'OOcHgnEpk9RHYBOiWllz',
  en: 'cRgaSK5ZVXnLDpWTL8MN',
  jp: 'OyDbjZxjk9r14eZnPELb'
}

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

  get(item: IListServiceContentDataItem): Promise<IAsset> {
    const asset = this.getAsset(item.id)
    return (asset && asset.ver === item.ver) ? Promise.resolve(GeneralUtils.deepCopy(asset)) : this.fetch(item)
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

  getFontMap(): { [key: string]: string } {
    return STANDARD_TEXT_FONT
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
          Vue.notify({
            group: 'error',
            text: `網路異常，請確認網路正常後再嘗試。(ErrorCode: ${error.message === 'Failed to fetch' ? 19 : error.message})`
          })
          return asset
        })
      }
    }
  }

  async addTemplate(json: any, attrs: IAssetProps = {}) {
    const { pageIndex, width, height } = attrs
    const targetPageIndex = pageIndex || this.lastSelectedPageIndex
    // const targetPage: IPage = this.getPage(targetPageIndex)
    json = await this.updateBackground(GeneralUtils.deepCopy(json))
    const newLayer = LayerFactary.newTemplate(TemplateUtils.updateTemplate(json))
    PageUtils.updateSpecPage(targetPageIndex, newLayer)
    if (width && height) {
      resizeUtils.resizePage(targetPageIndex, newLayer, { width, height })
      store.commit('UPDATE_pageProps', {
        pageIndex: targetPageIndex,
        props: { width, height }
      })
    }
    stepsUtils.record()
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
    const index = LayerUtils.getUpmostNonTextLayerIndex(currentPage.layers) + 1
    LayerUtils.addLayersToPos(targePageIndex, [LayerFactary.newShape(config)], index)
    ZindexUtils.reassignZindex(targePageIndex)
    stepsUtils.record()
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
    const index = LayerUtils.getUpmostNonTextLayerIndex(currentPage.layers) + 1
    LayerUtils.addLayersToPos(targePageIndex, [LayerFactary.newShape(config)], index)
    ZindexUtils.reassignZindex(targePageIndex)
    stepsUtils.record()
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
    const index = LayerUtils.getUpmostNonTextLayerIndex(currentPage.layers) + 1
    LayerUtils.addLayersToPos(targePageIndex, [LayerFactary.newShape(config)], index)
    ZindexUtils.reassignZindex(targePageIndex)
    stepsUtils.record()
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
    const index = LayerUtils.getUpmostNonTextLayerIndex(currentPage.layers) + 1
    LayerUtils.addLayersToPos(targePageIndex, [LayerFactary.newFrame(config)], index)
    ZindexUtils.reassignZindex(targePageIndex)
    stepsUtils.record()
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
      ? LayerFactary.newGroup(config, (config as IGroup).layers)
      : LayerFactary.newText(config)
    LayerUtils.addLayers(targePageIndex, [newLayer])
    stepsUtils.record()
  }

  addStanardText(type: string, text?: string, locale = 'tw', pageIndex?: number) {
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
        textLayer.paragraphs[0].spans[0].text = text
        if (locale === 'tw') {
          textLayer.paragraphs[0].spans[0].styles.weight = 'normal'
        }
        textLayer.paragraphs[0].spans[0].styles.font = STANDARD_TEXT_FONT[locale]
        TextUtils.resetTextField(textLayer, targePageIndex, field)
        LayerUtils.addLayers(targePageIndex, [LayerFactary.newText(Object.assign(textLayer, { editing: true }))])
        stepsUtils.record()
      })
      .catch(() => {
        console.log('Cannot find the file')
      })
  }

  addImage(url: string, photoAspectRatio: number, attrs: IAssetProps = {}) {
    const { pageIndex, isPreview, assetId: previewAssetId, assetIndex } = attrs
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
        assetId: assetIndex ?? (previewAssetId ?? ImageUtils.getAssetId(url, type))
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
    console.log(config)
    const index = LayerUtils.getUpmostNonTextLayerIndex(this.getPage(targePageIndex).layers) + 1
    LayerUtils.addLayersToPos(targePageIndex, [LayerFactary.newImage(config)], index)
    ZindexUtils.reassignZindex(targePageIndex)
    stepsUtils.record()
  }

  addGroupTemplate(item: IListServiceContentDataItem, childId?: string, resize?: { width: number, height: number }) {
    const { content_ids: contents = [], type, group_id: groupId, group_type: groupType } = item
    store.commit('SET_groupId', groupId)
    store.commit('SET_groupType', groupType)
    const promises = contents?.filter(content => childId ? content.id === childId : true)
      .map(content => this.get({ ...content, type }))
    this.addAssetToRecentlyUsed(item as any)
    return Promise.all(promises)
      .then(assets => {
        const updatePromise = assets.map(asset =>
          this.updateBackground(GeneralUtils.deepCopy(asset.jsonData) || {})
            .then(json => LayerFactary.newTemplate(TemplateUtils.updateTemplate(json)))
        )
        return Promise.all(updatePromise)
      })
      .then(jsonDataList => {
        // 單頁: 取代, 多頁: 空白取代/加入後面
        const lastSelectedPage: IPage = this.getPage(this.lastSelectedPageIndex)
        let targetIndex = this.lastSelectedPageIndex
        let replace = true
        if (!childId && lastSelectedPage && lastSelectedPage.layers.length) {
          // 多頁且當前頁面非空白 => 加入在最後頁面
          targetIndex = this.getPages.length
          replace = false
        }
        PageUtils.appendPagesTo(jsonDataList, targetIndex, replace)
        Vue.nextTick(() => {
          PageUtils.scrollIntoPage(targetIndex)
          // @TODO: resize page/layer before adding to the store.
          if (resize) {
            resizeUtils.resizePage(targetIndex, this.getPage(targetIndex), resize)
            store.commit('UPDATE_pageProps', {
              pageIndex: targetIndex,
              props: resize
            })
          }
          if (groupType === 1 && !resize) {
            // 電商詳情頁模板 + 全部加入 = 所有寬度設為1000
            for (const idx in jsonDataList) {
              const { height, width } = jsonDataList[idx]
              const pageIndex = +idx + targetIndex
              const newSize = { height: height * width / 1000, width: 1000 }
              resizeUtils.resizePage(pageIndex, this.getPage(pageIndex), newSize)
              store.commit('UPDATE_pageProps', {
                pageIndex,
                props: newSize
              })
            }
          }
          stepsUtils.record()
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
    const { id, type, width, height, content_ids: contentIds, match_cover: matchCover } = asset
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
          content_ids: contentIds,
          match_cover: matchCover
        })
        store.commit(`${typeModule}/SET_STATE`, { categories })
      }
      listApi.addDesign(id, typeCategory)
    }
  }
}

export default new AssetUtils()
