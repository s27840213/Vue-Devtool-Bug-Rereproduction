import store from '@/store'
import GeneralUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'
import { IStep } from '@/interfaces/steps'
import TextPropUtils from './textPropUtils'
import Vue from 'vue'
import { FunctionPanelType } from '@/store/types'
import pageUtils from './pageUtils'
import popupUtils from './popupUtils'
import uploadUtils from './uploadUtils'
import { IPage } from '@/interfaces/page'
import { IFrame, IGroup, ILayer, IShape, ITmp } from '@/interfaces/layer'

class StepsUtils {
  steps: Array<IStep>
  /**
   * @param {Array<number>} pageSteps  used to record the changed page for template update when we're update group template
   */
  pageSteps: Array<number>
  currStep: number
  MAX_STORAGE_COUNT: number
  get isPopupOpen(): boolean {
    return popupUtils.isPopupOpen
  }

  get isInFirstStep(): boolean {
    return (this.currStep === 0) && (this.steps.length > 1)
  }

  get isInLastStep(): boolean {
    return (this.currStep === (this.steps.length - 1)) && (this.steps.length > 1)
  }

  timers: { [key: string]: number }
  constructor() {
    this.steps = []
    this.pageSteps = []
    this.currStep = -1
    this.MAX_STORAGE_COUNT = 20
    this.timers = {}
  }

  filterForShapes(layer: ILayer): any {
    let typedLayer
    let newLayers
    let needFetch = false
    switch (layer.type) {
      case 'shape':
        typedLayer = layer as IShape
        typedLayer.svg = ''
        return typedLayer
      case 'tmp':
      case 'group':
        typedLayer = layer as IGroup
        newLayers = typedLayer.layers.map(layer => this.filterForShapes(layer))
        typedLayer.layers = newLayers
        return typedLayer
      case 'frame':
        typedLayer = layer as any
        if (typedLayer.decoration) {
          typedLayer.decoration = { color: typedLayer.decoration.color }
          needFetch = true
        }
        if (typedLayer.decorationTop) {
          typedLayer.decorationTop = { color: typedLayer.decorationTop.color }
          needFetch = true
        }
        typedLayer.needFetch = needFetch
        return typedLayer
      default:
        return layer
    }
  }

  filterForShapesInPages(pages: IPage[]): IPage[] {
    for (const page of pages) {
      const newLayers = page.layers.map(layer => this.filterForShapes(layer))
      page.layers = newLayers
    }
    return pages
  }

  record() {
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    const lastSelectedLayerIndex = store.getters.getLastSelectedLayerIndex
    const modifiedPage = pageUtils.getPage(lastSelectedPageIndex) as IPage
    if (modifiedPage.designId.length !== 0) {
      store.commit('SET_pageIsModified', {
        pageIndex: lastSelectedPageIndex,
        modified: modifiedPage.modified !== undefined
      })
    }
    const pages = this.filterForShapesInPages(GeneralUtils.deepCopy(store.getters.getPages))
    // Watch out! The deep cody method we use won't work on Set/Map object
    const currSelectedInfo = GeneralUtils.deepCopy(store.getters.getCurrSelectedInfo)

    // There's not any steps before, create the initial step first
    if (this.currStep < 0) {
      this.steps.push({ pages, lastSelectedPageIndex, lastSelectedLayerIndex, currSelectedInfo })
      this.pageSteps.push(lastSelectedPageIndex)
      this.currStep++
    } else {
      this.steps.length = this.currStep + 1
      if (this.steps.length === this.MAX_STORAGE_COUNT) {
        this.steps.shift()
      }
      this.steps.push({ pages, lastSelectedPageIndex, lastSelectedLayerIndex, currSelectedInfo })
      this.currStep = this.steps.length - 1
      // Don't upload the design when initialize the steps
      if (uploadUtils.isLogin) {
        uploadUtils.uploadDesign()
      }
    }
  }

  undo() {
    if (this.steps.length === 0 || this.currStep === 0) {
      return
    }
    if (this.isPopupOpen) {
      popupUtils.closePopup()
    }
    this.currStep--
    const pages = GeneralUtils.deepCopy(this.steps[this.currStep].pages)
    store.commit('SET_pages', pages)
    store.commit('SET_lastSelectedPageIndex', this.steps[this.currStep].lastSelectedPageIndex)
    store.commit('SET_lastSelectedLayerIndex', this.steps[this.currStep].lastSelectedLayerIndex)
    const { pageIndex, index } = this.steps[this.currStep].currSelectedInfo
    let layers
    if (pages[pageIndex]) {
      const selectedLayer = pages[pageIndex].layers[index]
      if (selectedLayer) {
        if (selectedLayer.type === 'tmp') {
          layers = selectedLayer.layers
        } else {
          layers = [selectedLayer]
        }
      } else {
        layers = []
      }
    } else {
      layers = []
    }
    GroupUtils.set(pageIndex, index, layers)
    if (pageIndex >= 0 && pageIndex !== pageUtils.currFocusPageIndex) {
      pageUtils.scrollIntoPage(pageIndex)
    }
    if (this.currStep > 0) {
      Vue.nextTick(() => {
        if (store.state.currFunctionPanelType === FunctionPanelType.textSetting) {
          TextPropUtils.updateTextPropsState()
        }
      })
    }

    if (uploadUtils.isLogin) {
      uploadUtils.uploadDesign()
    }
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

  redo() {
    if (this.currStep === this.steps.length - 1) {
      return
    }
    if (this.isPopupOpen) {
      popupUtils.closePopup()
    }
    this.currStep++
    const pages = GeneralUtils.deepCopy(this.steps[this.currStep].pages)
    store.commit('SET_pages', pages)
    store.commit('SET_lastSelectedPageIndex', this.steps[this.currStep].lastSelectedPageIndex)
    store.commit('SET_lastSelectedLayerIndex', this.steps[this.currStep].lastSelectedLayerIndex)
    const { pageIndex, index } = this.steps[this.currStep].currSelectedInfo
    let layers
    if (pages[pageIndex]) {
      const selectedLayer = pages[pageIndex].layers[index]
      if (selectedLayer) {
        if (selectedLayer.type === 'tmp') {
          layers = selectedLayer.layers
        } else {
          layers = [selectedLayer]
        }
      } else {
        layers = []
      }
    } else {
      layers = []
    }
    GroupUtils.set(pageIndex, index, layers)
    if (pageIndex >= 0 && pageIndex !== pageUtils.currFocusPageIndex) {
      pageUtils.scrollIntoPage(pageIndex)
    }
    Vue.nextTick(() => {
      if (store.state.currFunctionPanelType === FunctionPanelType.textSetting) {
        TextPropUtils.updateTextPropsState()
      }
    })

    if (uploadUtils.isLogin) {
      uploadUtils.uploadDesign()
    }
  }

  updateHead(pageIndex: number, layerIndex: number, props: any) {
    const pages = this.steps[this.currStep].pages
    const layer = pages[pageIndex].layers[layerIndex]
    for (const [key, value] of Object.entries(props)) {
      layer[key] = value
    }
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
}

const stepsUtils = new StepsUtils()

export default stepsUtils
