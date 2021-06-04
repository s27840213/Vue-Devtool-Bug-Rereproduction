// import store from '@/store'
import store from '@/store'
import { IPage } from '@/interfaces/page'
import GeneralUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'
import { IStep } from '@/interfaces/steps'

const MAX_STORAGE_COUNT = 20
class StepsUtils {
  steps: Array<IStep>
  currStep: number

  constructor() {
    this.steps = []
    this.currStep = -1
  }

  record() {
    // console.log('record')
    const pages = GeneralUtils.deepCopy(store.getters.getPages)
    // Watch out! The deep cody method we use won't work on Set/Map object
    const currSelectedInfo = GeneralUtils.deepCopy(store.getters.getCurrSelectedInfo)
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex

    if (this.currStep < 0) {
      this.steps.push({ pages, lastSelectedPageIndex, currSelectedInfo })
      this.currStep++
    } else {
      this.steps.length = this.currStep + 1
      if (this.steps.length === MAX_STORAGE_COUNT) {
        this.steps.shift()
      }
      this.steps.push({ pages, lastSelectedPageIndex, currSelectedInfo })
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
    GroupUtils.set(this.steps[this.currStep].currSelectedInfo.index, GeneralUtils.deepCopy(this.steps[this.currStep].currSelectedInfo.layers))
  }

  redo() {
    if (this.currStep === this.steps.length - 1) {
      return
    }
    this.currStep++
    store.commit('SET_pages', GeneralUtils.deepCopy(this.steps[this.currStep].pages))
    store.commit('SET_lastSelectedPageIndex', this.steps[this.currStep].lastSelectedPageIndex)
    GroupUtils.set(this.steps[this.currStep].currSelectedInfo.index, GeneralUtils.deepCopy(this.steps[this.currStep].currSelectedInfo.layers))
  }

  reset() {
    this.steps = []
  }
}

const stepsUtils = new StepsUtils()

export default stepsUtils
