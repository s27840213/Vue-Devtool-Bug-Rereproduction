import store from '@/store'
import GeneralUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'
import { IStep } from '@/interfaces/steps'
import TextPropUtils from './textPropUtils'
import Vue from 'vue'
import { FunctionPanelType } from '@/store/types'
import pageUtils from './pageUtils'
import popupUtils from './popupUtils'
import { IPage } from '@/interfaces/page'
import { IFrame, IGroup, IImage, ILayer, IShape, IText, ITmp } from '@/interfaces/layer'
import shapeUtils from './shapeUtils'
import { IListServiceContentDataItem } from '@/interfaces/api'
import assetUtils from './assetUtils'
import layerFactary from './layerFactary'
import textUtils from './textUtils'
import vivistickerUtils from './vivistickerUtils'
import workerUtils from './workerUtils'
import uploadUtils from './uploadUtils'

class StepsUtils {
  steps: Array<IStep>
  // /**
  //  * @param {Array<number>} pageSteps  used to record the changed page for template update when we're update group template
  //  */
  // pageSteps: Array<number>
  currStep: number
  MAX_STORAGE_COUNT: number
  get isPopupOpen(): boolean {
    return popupUtils.isPopupOpen
  }

  get isInFirstStep(): boolean {
    return (this.currStep === 0)
  }

  get isInLastStep(): boolean {
    return (this.currStep === (this.steps.length - 1))
  }

  timers: { [key: string]: number }
  constructor() {
    this.steps = []
    // this.pageSteps = []
    this.currStep = -1
    this.MAX_STORAGE_COUNT = 30
    this.timers = {}
  }

  filterDataForLayer(layer: ILayer): any {
    let typedLayer
    let newLayers
    switch (layer.type) {
      case 'shape':
        typedLayer = layer as IShape
        if ((!typedLayer.designId || typedLayer.designId === '') && !['D', 'E'].includes(typedLayer.category)) return typedLayer
        typedLayer.svg = ''
        return typedLayer
      case 'tmp':
      case 'group':
        typedLayer = layer as IGroup
        newLayers = typedLayer.layers.map(layer => this.filterDataForLayer(layer))
        typedLayer.layers = newLayers
        return typedLayer
      case 'frame':
        typedLayer = layer as any
        if (!typedLayer.designId || typedLayer.designId === '') return typedLayer
        if (typedLayer.decoration) {
          typedLayer.decoration.svg = ''
        }
        if (typedLayer.decorationTop) {
          typedLayer.decorationTop.svg = ''
        }
        return typedLayer
      case 'text':
        if (!GeneralUtils.isTouchDevice()) return layer
        typedLayer = layer as IText
        typedLayer.contentEditable = false
        return typedLayer
      default:
        return layer
    }
  }

  async refetchForShape(layer: IShape): Promise<any> {
    let shape
    switch (layer.category) {
      case 'D':
        await shapeUtils.addComputableInfo(layer)
        return layer
      case 'E':
        await shapeUtils.addComputableInfo(layer)
        return layer
      default:
        if (layer.designId && layer.designId !== '') {
          shape = await shapeUtils.fetchSvg(layer) as any
          layer.color && layer.color.length && (shape.color = layer.color)
          !layer.className && (layer.className = shapeUtils.classGenerator())
          const vSize = shape.vSize as number[]
          delete shape.styles
          Object.assign(layer, shape)
          Object.assign(layer.styles, {
            initWidth: vSize?.[0] ?? 0,
            initHeight: vSize?.[1] ?? 0
          })
        }
        return layer
    }
  }

  async refetchForFrame(layer: any): Promise<any> {
    if (!layer.designId || layer.designId === '') return layer
    const asset = {
      type: 8,
      id: layer.designId,
      ver: store.getters['user/getVerUni']
    } as IListServiceContentDataItem

    const res = await assetUtils.get(asset)
    const json = res.jsonData as IFrame

    (layer.clips as IImage[]).forEach((img, idx) => {
      if (json.clips[idx]) {
        img.clipPath = json.clips[idx].clipPath
      }
    })

    if (layer.decoration && json.decoration) {
      json.decoration.color = [...layer.decoration.color] as [string]
      layer.decoration = layerFactary.newShape({
        ...json.decoration,
        vSize: [layer.styles.initWidth, layer.styles.initHeight],
        styles: {
          width: layer.styles.initWidth,
          height: layer.styles.initHeight,
          initWidth: layer.styles.initWidth,
          initHeight: layer.styles.initHeight
        }
      })
    }
    if (layer.decorationTop && json.decorationTop) {
      json.decorationTop.color = [...layer.decorationTop.color] as [string]
      layer.decorationTop = layerFactary.newShape({
        ...json.decorationTop,
        vSize: [layer.styles.initWidth, layer.styles.initHeight],
        styles: {
          width: layer.styles.initWidth,
          height: layer.styles.initHeight,
          initWidth: layer.styles.initWidth,
          initHeight: layer.styles.initHeight
        }
      })
    }
    return layer
  }

  async fillLoadingSize(layer: IText): Promise<IText> {
    const dimension = layer.styles.writingMode.includes('vertical') ? layer.styles.height : layer.styles.width
    const initSize = {
      width: layer.styles.width,
      height: layer.styles.height,
      widthLimit: layer.widthLimit === -1 ? -1 : dimension
    }
    layer.widthLimit = await textUtils.autoResize(layer, initSize)
    return layer
  }

  async fillDataForLayer(layer: ILayer): Promise<any> {
    let typedLayer
    const newLayers = []
    switch (layer.type) {
      case 'shape':
        typedLayer = layer as IShape
        return await this.refetchForShape(typedLayer)
      case 'text':
        typedLayer = layer as IText
        return await this.fillLoadingSize(typedLayer)
      case 'tmp':
      case 'group':
        typedLayer = layer as IGroup
        for (const subLayer of typedLayer.layers) {
          newLayers.push(await this.fillDataForLayer(subLayer))
        }
        typedLayer.layers = newLayers
        return typedLayer
      case 'frame':
        typedLayer = layer as any
        return await this.refetchForFrame(typedLayer)
      default:
        return layer
    }
  }

  filterDataForLayersInPages(pages: IPage[]): IPage[] {
    for (const page of pages) {
      const newLayers = page.layers.map(layer => this.filterDataForLayer(layer))
      page.layers = newLayers
    }
    return pages
  }

  async fillDataForLayersInPages(pages: IPage[]): Promise<IPage[]> {
    const pagePromises = []
    for (const [pageIndex, page] of pages.entries()) {
      if (pageUtils.isOutOfBound(pageIndex)) continue
      pagePromises.push(new Promise((resolve, reject) => {
        try {
          const layerPromises = []
          for (const layer of page.layers) {
            layerPromises.push(this.fillDataForLayer(layer))
          }
          Promise.all(layerPromises).then((layers) => {
            page.layers = layers
            resolve(page)
          })
        } catch (error) {
          reject(error)
        }
      }))
    }
    await Promise.all(pagePromises)
    return pages
  }

  record() {
    const lastSelectedLayerIndex = store.getters.getLastSelectedLayerIndex
    // const modifiedPage = pageUtils.getPage(middlemostPageIndex) as IPage
    // if (modifiedPage.designId.length !== 0) {
    //   store.commit('SET_pageIsModified', {
    //     pageIndex: middlemostPageIndex,
    //     modified: modifiedPage.modified !== undefined
    //   })
    // }
    const pages = this.filterDataForLayersInPages(GeneralUtils.deepCopy(store.getters.getPages))
    // Watch out! The deep cody method we use won't work on Set/Map object
    const currSelectedInfo = GeneralUtils.deepCopy(store.getters.getCurrSelectedInfo)

    // There's not any steps before, create the initial step first
    if (this.currStep < 0) {
      this.steps.push({ pages, lastSelectedLayerIndex, currSelectedInfo })
      // this.pageSteps.push(middlemostPageIndex)
      this.currStep++
    } else {
      // if step isn't in last step and we record new step, we need to remove all steps larger than curr step
      this.steps.length = this.currStep + 1
      if (this.steps.length === this.MAX_STORAGE_COUNT) {
        this.steps.shift()
      }
      this.steps.push({ pages, lastSelectedLayerIndex, currSelectedInfo })
      this.currStep = this.steps.length - 1
      // Don't upload the design when initialize the steps
      vivistickerUtils.saveDesign()
    }
  }

  async asyncRecord() {
    const clonedData = await workerUtils.asyncCloneDeep({
      pages_1: store.getters.getPages,
      // pages_2: GeneralUtils.deepCopy(store.getters.getPages),
      selectedInfo: store.getters.getCurrSelectedInfo
    })
    const pages_2 = await workerUtils.asyncCloneDeep(store.getters.getPages)

    if (clonedData) {
      const pages = this.filterDataForLayersInPages(clonedData.pages_1)
      const currSelectedInfo = clonedData.selectedInfo
      const lastSelectedLayerIndex = store.getters.getLastSelectedLayerIndex
      // console.log(GeneralUtils.deepCopy(clonedData.pages_1))
      /**
       * The following code modify the wrong config state cause by the async
       */
      if (currSelectedInfo.layers.length === 1) {
        currSelectedInfo.layers[0].active = true
      }
      // pages[currSelectedInfo.pageIndex].layers[lastSelectedLayerIndex].active = true
      // if (currIndex !== lastSelectedLayerIndex) {
      //   pages[currSelectedInfo.pageIndex].layers[currIndex].active = false
      //   clonedData.pages_2[currSelectedInfo.pageIndex].layers[currIndex].active = false
      // }

      // There's not any steps before, create the initial step first
      if (this.currStep < 0) {
        this.steps.push({ pages, lastSelectedLayerIndex, currSelectedInfo })
        this.currStep++
      } else {
        // if step isn't in last step and we record new step, we need to remove all steps larger than curr step
        this.steps.length = this.currStep + 1
        if (this.steps.length === this.MAX_STORAGE_COUNT) {
          this.steps.shift()
        }
        this.steps.push({ pages, lastSelectedLayerIndex, currSelectedInfo })
        this.currStep = this.steps.length - 1
        // Don't upload the design when initialize the steps
        if (uploadUtils.isLogin) {
          uploadUtils.uploadDesign(undefined, { clonedPages: pages_2 })
          // uploadUtils.uploadDesign(undefined, { clonedPages: clonedData.pages_2 })
        }
      }
    }
  }

  async undo() {
    if (this.steps.length === 0 || this.currStep === 0 || textUtils.isFontLoading) {
      return
    }
    if (this.isPopupOpen) {
      popupUtils.closePopup()
    }
    this.currStep--
    const pages = await this.fillDataForLayersInPages(GeneralUtils.deepCopy(this.steps[this.currStep].pages))
    store.commit('SET_pages', pages)
    store.commit('SET_lastSelectedLayerIndex', this.steps[this.currStep].lastSelectedLayerIndex)
    GroupUtils.setBySelectedInfo(this.steps[this.currStep].currSelectedInfo, pages)
    if (this.currStep > 0) {
      Vue.nextTick(() => {
        if (store.state.currFunctionPanelType === FunctionPanelType.textSetting) {
          TextPropUtils.updateTextPropsState()
        }
      })
    }

    vivistickerUtils.saveDesign()
  }

  delayedRecord(key: string, interval = 300) {
    if (this.timers[key]) {
      clearTimeout(this.timers[key])
      delete this.timers[key]
    }
    this.timers[key] = setTimeout(() => {
      this.record()
    }, interval)
  }

  async redo() {
    if (this.currStep === this.steps.length - 1 || textUtils.isFontLoading) {
      return
    }
    if (this.isPopupOpen) {
      popupUtils.closePopup()
    }
    this.currStep++
    const pages = await this.fillDataForLayersInPages(GeneralUtils.deepCopy(this.steps[this.currStep].pages))
    store.commit('SET_pages', pages)
    store.commit('SET_lastSelectedLayerIndex', this.steps[this.currStep].lastSelectedLayerIndex)
    GroupUtils.setBySelectedInfo(this.steps[this.currStep].currSelectedInfo, pages)
    Vue.nextTick(() => {
      if (store.state.currFunctionPanelType === FunctionPanelType.textSetting) {
        TextPropUtils.updateTextPropsState()
      }
    })

    vivistickerUtils.saveDesign()
  }

  updateHead(pageIndex: number, layerIndex: number, props: any, subLayerIdx = -1) {
    if (this.currStep < 0) return
    const pages = this.steps[this.currStep].pages
    const layer = subLayerIdx === -1
      ? pages[pageIndex]?.layers?.[layerIndex] : (pages[pageIndex]?.layers?.[layerIndex] as IGroup)?.layers[subLayerIdx]
    if (!layer) return
    for (const [key, value] of Object.entries(props)) {
      layer[key] = value
    }
  }

  getPrevPages() {
    return this.steps[this.currStep].pages
  }

  reset() {
    this.clearSteps()
    this.record()
  }

  // When leave the route of editor, we may use this function alone without creating a new step
  clearSteps() {
    this.steps = []
    this.currStep = -1
  }

  clearCurrStep() {
    this.steps.splice(this.currStep--, 1)
  }
}

const stepsUtils = new StepsUtils()

export default stepsUtils
