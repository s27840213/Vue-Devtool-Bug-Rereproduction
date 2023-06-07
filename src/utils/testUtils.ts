import { IPage } from '@/interfaces/page'
import generalUtils from '@/utils/generalUtils'
import { notify } from '@kyvg/vue3-notification'

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
}

export default new TestUtils()
