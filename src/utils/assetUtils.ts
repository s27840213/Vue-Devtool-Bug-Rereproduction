import { captureException } from '@sentry/browser'
import store from '@/store'
import { IAsset, IAssetProps } from '@/interfaces/module'
import TemplateUtils from './templateUtils'
import PageUtils from './pageUtils'
import ShapeUtils from './shapeUtils'
import LayerUtils from './layerUtils'
import LayerFactary from './layerFactary'
import GeneralUtils from './generalUtils'
import ImageUtils from './imageUtils'
import { IGroup, IImage } from '@/interfaces/layer'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import TextUtils from './textUtils'

class AssetUtils {
  host = 'https://template.vivipic.com'
  data = 'config.json'
  preview = 'prev'

  get getAsset() { return store.getters.getAsset }
  get getPage() { return store.getters.getPage }
  get getLayer() { return store.getters.getLayer }
  get layerIndex() { return store.getters.getCurrSelectedIndex }
  get lastSelectedPageIndex() { return store.getters.getLastSelectedPageIndex }

  get(id: string, type: string): IAsset {
    const asset = this.getAsset(id)
    return asset ? GeneralUtils.deepCopy(asset) : this.fetch(id, type)
  }

  fetch(id: string, type: string): Promise<IAsset> {
    const asset = { id } as IAsset
    switch (type) {
      case 'background': {
        return new Promise((resolve) => {
          const srcObj = { type, assetId: id, userId: '' }
          const fullUrl = ImageUtils.getSrc({ srcObj } as IImage)
          const image = new Image()
          image.onload = () => {
            Object.assign(asset, {
              fullUrl,
              width: image.width,
              height: image.height
            })
            store.commit('SET_assetJson', { [id]: asset })
            resolve(asset)
          }
          image.src = fullUrl
        })
      }
      default: {
        const path = [this.host, type, id, this.data].join('/')
        return fetch(path)
          .then(response => response.json())
          .then(jsonData => {
            const { width, height } = jsonData.styles || {}
            const asset = { jsonData, id, width, height } as IAsset
            store.commit('SET_assetJson', { [id]: asset })
            return asset
          })
      }
    }
  }

  async addTemplate(id: string, attrs: IAssetProps = {}) {
    const { pageIndex } = attrs
    const targePageIndex = pageIndex || this.lastSelectedPageIndex
    try {
      const { jsonData } = await this.get(id, 'template')
      const json = TemplateUtils.updateTemplate(jsonData)
      PageUtils.updateSpecPage(targePageIndex, json)
    } catch (error) {
      captureException(error)
    }
  }

  async addSvg(id: string, attrs: IAssetProps = {}) {
    const { pageIndex, styles = {} } = attrs
    const targePageIndex = pageIndex || this.lastSelectedPageIndex
    try {
      const { jsonData } = await this.get(id, 'svg')
      if (!jsonData) { throw new Error('jsonData: undefined') }
      const currentPage = this.getPage(targePageIndex)
      const resizeRatio = 0.55
      const pageAspectRatio = currentPage.width / currentPage.height
      const svgAspectRatio = (jsonData.vSize as number[])[0] / (jsonData.vSize as number[])[1]
      const svgWidth = svgAspectRatio > pageAspectRatio ? currentPage.width * resizeRatio : (currentPage.height * resizeRatio) * svgAspectRatio
      const svgHeight = svgAspectRatio > pageAspectRatio ? (currentPage.width * resizeRatio) / svgAspectRatio : currentPage.height * resizeRatio
      jsonData.ratio = 1
      jsonData.className = ShapeUtils.classGenerator()

      const config = {
        ...jsonData,
        styles: {
          x: currentPage.width / 2 - svgWidth / 2,
          y: currentPage.height / 2 - svgHeight / 2,
          width: svgWidth,
          height: svgHeight,
          initWidth: (jsonData.vSize as number[])[0],
          initHeight: (jsonData.vSize as number[])[1],
          scale: svgWidth / (jsonData.vSize as number[])[0],
          color: jsonData.color,
          vSize: jsonData.vSize,
          ...styles
        }
      }
      LayerUtils.addLayers(targePageIndex, LayerFactary.newShape(config))
    } catch (error) {
      captureException(error)
    }
  }

  async addBackground(id: string, attrs: IAssetProps = {}) {
    const { pageIndex } = attrs
    const targePageIndex = pageIndex || this.lastSelectedPageIndex
    try {
      const { width = 0, height = 0 } = await this.get(id, 'background')
      const config = LayerFactary.newImage({
        styles: {
          width: width / 2,
          height: height / 2,
          x: 200,
          y: 200
        },
        srcObj: {
          type: 'background',
          assetId: id,
          userId: ''
        }
      })
      store.commit('SET_backgroundImage', {
        pageIndex: targePageIndex,
        config
      })
    } catch (error) {
      captureException(error)
    }
  }

  async addText (id: string, attrs: IAssetProps = {}) {
    const { pageIndex, styles = {} } = attrs
    const { x, y } = styles
    const targePageIndex = pageIndex || this.lastSelectedPageIndex
    try {
      const { jsonData, width = 0, height = 0 } = await this.get(id, 'text')
      if (!jsonData) { throw new Error('jsonData: undefined') }
      const config = {
        ...jsonData,
        styles: {
          ...jsonData.styles
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
      LayerUtils.addLayers(targePageIndex, newLayer)
    } catch (error) {
      captureException(error)
    }
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
        const textLayer = GeneralUtils.deepCopy(jsonData)
        TextUtils.resetTextField(textLayer, targePageIndex, field)
        LayerUtils.addLayers(targePageIndex, LayerFactary.newText(Object.assign(textLayer, { editing: true })))
      })
      .catch(() => {
        console.log('Cannot find the file')
      })
  }
}

export default new AssetUtils()
