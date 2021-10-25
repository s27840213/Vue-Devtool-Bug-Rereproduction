// import store from '@/store'
import store from '@/store'
import GeneralUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'
import { IStep } from '@/interfaces/steps'
import TextPropUtils from './textPropUtils'
import Vue from 'vue'
import { FunctionPanelType } from '@/store/types'

const MAX_STORAGE_COUNT = 20
class StepsUtils {
  steps: Array<IStep>
  currStep: number

  constructor() {
    this.steps = []
    this.currStep = -1
  }

  record() {
    console.log('record')
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
      if (this.steps.length === MAX_STORAGE_COUNT) {
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
    this.currStep--
    store.commit('SET_pages', GeneralUtils.deepCopy(this.steps[this.currStep].pages))
    store.commit('SET_lastSelectedPageIndex', this.steps[this.currStep].lastSelectedPageIndex)
    store.commit('SET_lastSelectedLayerIndex', this.steps[this.currStep].lastSelectedLayerIndex)
    GroupUtils.set(0, this.steps[this.currStep].currSelectedInfo.index, GeneralUtils.deepCopy(this.steps[this.currStep].currSelectedInfo.layers))
    if (this.currStep > 0) {
      Vue.nextTick(() => {
        if (store.state.currFunctionPanelType === FunctionPanelType.textSetting) {
          TextPropUtils.updateTextPropsState()
        }
      })
    }
  }

  redo() {
    if (this.currStep === this.steps.length - 1) {
      return
    }
    this.currStep++
    store.commit('SET_pages', GeneralUtils.deepCopy(this.steps[this.currStep].pages))
    store.commit('SET_lastSelectedPageIndex', this.steps[this.currStep].lastSelectedPageIndex)
    store.commit('SET_lastSelectedLayerIndex', this.steps[this.currStep].lastSelectedLayerIndex)
    GroupUtils.set(0, this.steps[this.currStep].currSelectedInfo.index, GeneralUtils.deepCopy(this.steps[this.currStep].currSelectedInfo.layers))
    Vue.nextTick(() => {
      if (store.state.currFunctionPanelType === FunctionPanelType.textSetting) {
        TextPropUtils.updateTextPropsState()
      }
    })
  }

  reset() {
    this.steps = []
  }
}

const stepsUtils = new StepsUtils()

export default stepsUtils
