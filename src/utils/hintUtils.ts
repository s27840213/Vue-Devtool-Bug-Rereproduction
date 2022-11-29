import Vue, { nextTick } from 'vue'

class HintUtils {
  showHint: boolean
  timerId: number
  currHint: string

  constructor() {
    this.showHint = false
    this.timerId = -1
    this.currHint = 'default hint'
  }

  openHint(target: HTMLElement, hint: string) {
    this.showHint = true
    this.currHint = hint
    this.showHintUnderTarget(target)
  }

  closeHint() {
    this.showHint = false
  }

  bind(el: HTMLElement, hint: string, timeInterval = 300) {
    el.addEventListener('mouseenter', () => {
      this.timerId = setTimeout(() => {
        this.openHint(el, hint)
      }, timeInterval)
    })
    el.addEventListener('mouseleave', () => {
      this.closeHint()
      clearTimeout(this.timerId)
    })
  }

  unbind(el: HTMLElement, hint: string, timeInterval = 300) {
    el.removeEventListener('mouseenter', () => {
      this.timerId = setTimeout(() => {
        this.openHint(el, hint)
      }, timeInterval)
    })
    el.removeEventListener('mouseleave', () => {
      clearTimeout(this.timerId)
    })
    clearTimeout(this.timerId)
    this.closeHint()
  }

  private showHintUnderTarget(target: HTMLElement) {
    nextTick(() => {
      const el = document.querySelector('.hint') as HTMLElement
      const [width, height] = [el.offsetWidth, el.offsetHeight]
      const [vw, vh] = [window.innerWidth || document.documentElement.clientWidth, window.innerHeight || document.documentElement.clientHeight]
      const { left, bottom, width: targetWidth, height: targetHeight } = target?.getBoundingClientRect() as DOMRect
      let xDiff = 0
      let yDiff = 0

      const posX = left
      const posY = bottom
      if ((left + width) > vw) {
        xDiff = (left + width) - vw
      }

      if ((bottom + height) > vh) {
        yDiff = (bottom + height) - vh
      }

      el.style.transform = `translate3d(${posX - ((width - targetWidth) / 2) - xDiff}px, ${posY - yDiff + 5}px,0)`
    })
  }
}

export default new HintUtils()
