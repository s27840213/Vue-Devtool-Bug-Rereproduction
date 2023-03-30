/**
 * @Note this could be used only in moible
 */

interface SwipeOptions {
  tolerance: number
  velocityLimit: number
  targetDirection: 'all' | 'horizontal' | 'vertical'
}

export default class SwipeDetector {
  private touchStartX = 0
  private touchStartY = 0
  private touchEndX = 0
  private touchEndY = 0
  private swipeOptions: SwipeOptions
  private startTime = 0
  private movedFlag = false
  private callback: (direction: string) => void

  constructor(private element: HTMLElement, options?: Partial<SwipeOptions>, callback?: (direction: string) => void) {
    const defaultOptions: SwipeOptions = {
      tolerance: 20,
      velocityLimit: 30,
      targetDirection: 'all'
    }
    this.swipeOptions = { ...defaultOptions, ...options }
    this.callback = callback || ((direction) => console.log(direction))
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this))
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this))
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this))
  }

  private handleTouchStart(event: TouchEvent) {
    this.startTime = performance.now()
    this.touchStartX = event.touches[0].clientX
    this.touchStartY = event.touches[0].clientY
  }

  private handleTouchMove(event: TouchEvent) {
    if (!this.movedFlag) {
      this.movedFlag = true
    }
    this.touchEndX = event.touches[0].clientX
    this.touchEndY = event.touches[0].clientY
  }

  private handleTouchEnd(event: TouchEvent) {
    if (this.movedFlag) {
      const swipeX = this.touchEndX - this.touchStartX
      const swipeY = this.touchEndY - this.touchStartY
      const duration = performance.now() - this.startTime
      const vx = Math.abs(swipeX / duration) * 1000
      const vy = Math.abs(swipeY / duration) * 1000
      if (
        ['all', 'horizontal'].includes(this.swipeOptions.targetDirection) &&
        Math.abs(swipeX) > Math.abs(swipeY) &&
        Math.abs(swipeY) > this.swipeOptions.tolerance &&
        vx > this.swipeOptions.velocityLimit
      ) {
        if (swipeX > 0) {
          this.callback('right')
        } else {
          this.callback('left')
        }
      } else if (
        ['all', 'vertical'].includes(this.swipeOptions.targetDirection) &&
        Math.abs(swipeY) > this.swipeOptions.tolerance &&
        vy > this.swipeOptions.velocityLimit
      ) {
        if (swipeY > 0) {
          this.callback('down')
        } else {
          this.callback('up')
        }
      }

      this.movedFlag = false
    }
  }

  unbind() {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this))
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this))
  }
}
