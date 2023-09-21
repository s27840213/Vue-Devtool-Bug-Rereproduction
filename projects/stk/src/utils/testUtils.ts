import { IText } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import store from '@/store'
import generalUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import textPropUtils from '@/utils/textPropUtils'
import textUtils from '@/utils/textUtils'
import { notify } from '@kyvg/vue3-notification'
import { cloneDeep } from 'lodash'
import { nextTick } from 'vue'

class TestUtils {
  toShowTouchPoint: boolean
  timer: Record<string, {
    start: number
    notify: boolean
  }>

  constructor() {
    this.timer = {}
    this.toShowTouchPoint = false
  }

  start(key: string, notify = true) {
    this.timer[key] = {
      start: (new Date()).getTime(),
      notify
    }
    console.log(`${key}: start`)
  }

  log(key: string, msg: string) {
    const timer = this.timer[key]
    const duration = (new Date()).getTime() - timer.start
    const result = `${key}: ${msg}, ${duration}`
    console.log(result)
    if (timer.notify) {
      notify({
        group: 'copy',
        text: result
      })
    }
  }

  /**
   * Flags: Layers performance measurement tool
   * Usage: Measure time of multiple layer task.
   * Call initializeFlags at the start of measue.
   * Call setDoneFlag when a layer task finished.
   *
   * Example:
   * step 1: Initial at task start (ScaleRatioEditor.vue):
   * setIsShowPagePreview(show: boolean) {
   *   if (show) { // Start to render page preview.
   *     testUtils.initializeFlags('text')
   *   }
   * },
   *
   * step 2: Set flag when finish one task (NuText.vue):
   * mounted() {
   *   textUtils.untilFontLoaded(this.config.paragraphs, true).then(() => {
   *     // Font load finished, set flag.
   *     testUtils.setDoneFlag(this.pageIndex, this.layerIndex, this.subLayerIndex)
   *   })
   * },
   */

  initializeFlags(layerType: string, key = 'flags', pages?: IPage[]) {
    generalUtils.initializeFlags(layerType, pages, () => {
      this.log(key, 'done rendering')
    })
    this.start(key)
  }

  setDoneFlag(pageIndex: number, layerIndex: number, subLayerIndex?: number) {
    generalUtils.setDoneFlag(pageIndex, layerIndex, subLayerIndex)
  }

  showTouchPoint(e: TouchEvent) {
    const pointSize = 20
    const pointColor = 'rgba(255, 0, 0, 0.5)'
    document.querySelectorAll('.touch-point').forEach((e) => { e.remove() })
    const touchPoint = document.createElement('div')
    touchPoint.classList.add('touch-point')
    touchPoint.style.position = 'fixed'
    touchPoint.style.left = `${e.touches[0].clientX - pointSize / 2}px`
    touchPoint.style.top = `${e.touches[0].clientY - pointSize / 2}px`
    touchPoint.style.width = `${pointSize}px`
    touchPoint.style.height = `${pointSize}px`
    touchPoint.style.background = pointColor
    touchPoint.style.borderRadius = '50%'
    touchPoint.style.zIndex = '1000'
    touchPoint.style.pointerEvents = 'none'
    document.body.appendChild(touchPoint)
  }

  startShowingTouchPoint() {
    window.addEventListener('touchstart', this.showTouchPoint, { capture: true })
    this.toShowTouchPoint = true
  }

  stopShowingTouchPoint() {
    window.removeEventListener('touchstart', this.showTouchPoint, { capture: true })
    this.toShowTouchPoint = false
  }

  toggleShowingTouchPoint() {
    if (this.toShowTouchPoint) {
      this.stopShowingTouchPoint()
    } else {
      this.startShowingTouchPoint()
    }
  }

  /**
   * This function is used to create a design with all available fonts, which helps address font-related issues.
   * Usage:
   *  1. Create a design with only one page.
   *  2. Add some text to the page.
   *  3. Click the "testAllFonts" button in the PopupFile.
   *  4. Wait for the "testAllFonts" process to complete without interacting with your browser.
   * - When setting the font, the "testAllFonts" function will apply 2 texts to the same font.
   * This is done to create an experimental group and a control group for comparison purposes.
   * Therefore, you should set the 2 texts to the experimental group and leave the other text unaffected.
   * - Make sure that no text had been multi-selected, or their widthLimit will not be -1.
   */
  async testAllFonts(start: number, end: number) {
    // Get all font list.
    await store.dispatch('font/getCategories')
    while (store.state.font.nextPage !== -1) {
      console.log('get more font')
      await store.dispatch('font/getMoreCategory')
    }

    // Apply all font.
    const fonts = (store.state.font.categories).flatMap(cate => cate.is_recent ? [] : cate.list)
    const currPage = layerUtils.getCurrPage
    let fontIndex = start
    currPage.layers.forEach(layer => {
      if (layer.type !== 'text') notify('有圖片layer 請刪除')
    })

    while (fontIndex < end) {
      const { pageIndex } = layerUtils
      for (let i = 0; i < currPage.layers.length; i++) {
        groupUtils.select(pageIndex, [i])
        await generalUtils.sleep(100)

        // Set font
        const font = fonts[fontIndex] as unknown as Record<string, string>
        textPropUtils.applyPropsToAll('span,paragraph', {
          type: font.src || font.fontType, // public fonts in list-design don't have src
          fontUrl: font.fontUrl ?? '',
          userId: font.userId ?? '',
          assetId: font.assetId ?? '',
          font: font.id,
        })
        console.log('set', font.name)

        // Download font
        await store.dispatch('text/addFont', {
          type: font.src || font.fontType, // public fonts in list-design don't have src
          url: font.fontUrl,
          userId: font.userId,
          assetId: font.assetId,
          face: font.id,
          ver: font.ver,
        })
        await textUtils.untilFontLoaded((currPage.layers[i] as IText).paragraphs)
        await generalUtils.sleep(500)

        // Re-calc text w/h
        textUtils.updateTextLayerSizeByShape(pageIndex, i, -1)
        groupUtils.deselect()
        groupUtils.reset()
        if (i % 2) fontIndex++
      }

      // Add next page
      await generalUtils.sleep(1000)
      pageUtils.addPage(pageUtils.newPage(cloneDeep(currPage)))
      nextTick(() => {
        pageUtils.scrollIntoPage(pageIndex + 1)
        pageUtils.activePage(pageIndex + 1)
      })
      await generalUtils.sleep(1000)
    }
    stepsUtils.record()
  }
}

export default new TestUtils()
