import { IGroup } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import store from '@/store'
import Vue from 'vue'

class TestUtils {
  timer: Record<string, {
    start: number
    notify: boolean
  }>

  flags: {[key: string]: boolean}[]

  constructor() {
    this.timer = {}
    this.flags = []
  }

  start(key: string, notify = true) {
    this.timer[key] = {
      start: (new Date()).getTime(),
      notify
    }
    console.log(`${key}: start`)
  }

  /**
   * Example:
   * in NuText.vue:
   * mounted() {
   *   textUtils.untilFontLoaded(this.config.paragraphs, true).then(() => {
   *     setTimeout(() => {
   *       testUtils.setDoneFlag(this.pageIndex, this.layerIndex, this.subLayerIndex)
   *     }, 100)
   *   })
   * },
   * **************
   * in ScaleRatioEditor.vue:
   * setIsShowPagePreview(show: boolean) {
   *   if (show) {
   *     testUtils.initializeFlags('text')
   *   }
   * },
   */

  initializeFlags(layerType: string) {
    const pages = store.getters.getPages
    const pageNum = pages.length
    const layerIndexes = this.getlayerIndexes(pages, layerType)
    this.flags = []
    for (let i = 0; i < pageNum; i++) {
      const pageArray = {} as {[key: string]: boolean}
      for (let j = 0; j < layerIndexes[i].length; j++) {
        pageArray[layerIndexes[i][j]] = false
      }
      this.flags.push(pageArray)
    }
    this.start('flags')
  }

  setDoneFlag(pageIndex: number, layerIndex: number, subLayerIndex?: number) {
    const key = `${layerIndex},${subLayerIndex ?? -1}`
    if (!this.flags[pageIndex] || this.flags[pageIndex][key] === undefined) return
    this.flags[pageIndex][key] = true
    if (this.flags.every(pageFlags => Object.values(pageFlags).every(flag => flag))) {
      this.log('flags', 'done rendering')
      this.flags = []
    }
  }

  getlayerIndexes(pages: IPage[], layerType: string): string[][] {
    const textLayerIndexes = []
    for (const page of pages) {
      const indexes = []
      for (const [index, layer] of page.layers.entries()) {
        if (layer.type === layerType) {
          indexes.push(`${index},-1`)
        }
        if (layer.type === 'group') {
          for (const [subIndex, subLayer] of (layer as IGroup).layers.entries()) {
            if (subLayer.type === layerType) {
              indexes.push(`${index},${subIndex}`)
            }
          }
        }
      }
      textLayerIndexes.push(indexes)
    }
    return textLayerIndexes
  }

  log(key: string, msg: string) {
    const timer = this.timer[key]
    const duration = (new Date()).getTime() - timer.start
    const result = `${key}: ${msg}, ${duration}`
    console.log(result)
    if (timer.notify) {
      Vue.notify({
        group: 'copy',
        text: result
      })
    }
  }
}

export default new TestUtils()
