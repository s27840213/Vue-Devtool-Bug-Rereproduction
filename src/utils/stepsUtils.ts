// import store from '@/store'
import store from '@/store'
import GeneralUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'
import { IStep } from '@/interfaces/steps'
import TextPropUtils from './textPropUtils'
import Vue from 'vue'
import { FunctionPanelType } from '@/store/types'
import pageUtils from './pageUtils'
import popupUtils from './popupUtils'

class StepsUtils {
  steps: Array<IStep>
  currStep: number
  MAX_STORAGE_COUNT: number
  get isPopupOpen(): boolean {
    return popupUtils.isPopupOpen
  }

  timers: { [key: string]: number }
  constructor() {
    this.steps = []
    this.currStep = -1
    this.MAX_STORAGE_COUNT = 20
    this.timers = {}
  }

  record() {
    console.trace()
    const pages = GeneralUtils.deepCopy(store.getters.getPages)
    // Watch out! The deep cody method we use won't work on Set/Map object
    const currSelectedInfo = GeneralUtils.deepCopy(store.getters.getCurrSelectedInfo)
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    const lastSelectedLayerIndex = store.getters.getLastSelectedLayerIndex
    if (this.currStep < 0) {
      this.steps.push({ pages, lastSelectedPageIndex, lastSelectedLayerIndex, currSelectedInfo })
      this.currStep++
    } else {
      this.steps.length = this.currStep + 1
      if (this.steps.length === this.MAX_STORAGE_COUNT) {
        this.steps.shift()
      }
      this.steps.push({ pages, lastSelectedPageIndex, lastSelectedLayerIndex, currSelectedInfo })
      this.currStep = this.steps.length - 1
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
    store.commit('SET_pages', GeneralUtils.deepCopy(this.steps[this.currStep].pages))
    store.commit('SET_lastSelectedPageIndex', this.steps[this.currStep].lastSelectedPageIndex)
    store.commit('SET_lastSelectedLayerIndex', this.steps[this.currStep].lastSelectedLayerIndex)
    const { pageIndex, index, layers } = this.steps[this.currStep].currSelectedInfo
    GroupUtils.set(pageIndex, index, GeneralUtils.deepCopy(layers))
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
    store.commit('SET_pages', GeneralUtils.deepCopy(this.steps[this.currStep].pages))
    store.commit('SET_lastSelectedPageIndex', this.steps[this.currStep].lastSelectedPageIndex)
    store.commit('SET_lastSelectedLayerIndex', this.steps[this.currStep].lastSelectedLayerIndex)
    const { pageIndex, index, layers } = this.steps[this.currStep].currSelectedInfo
    GroupUtils.set(pageIndex, index, GeneralUtils.deepCopy(layers))
    if (pageIndex >= 0 && pageIndex !== pageUtils.currFocusPageIndex) {
      pageUtils.scrollIntoPage(pageIndex)
    }
    Vue.nextTick(() => {
      if (store.state.currFunctionPanelType === FunctionPanelType.textSetting) {
        TextPropUtils.updateTextPropsState()
      }
    })
  }

  reset() {
    this.steps = []
    this.currStep = -1
  }
}

const stepsUtils = new StepsUtils()

export default stepsUtils
