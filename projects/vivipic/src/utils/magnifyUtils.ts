import store from '@/store'
import mouseUtils from '@/utils/mouseUtils'

class MagnifyUtils {
  private magnifyCanvas: HTMLCanvasElement
  private contentCanvas: HTMLCanvasElement
  private targetEl: HTMLElement
  private magnifyContext: CanvasRenderingContext2D
  private posInMagnifierCanvas = { x: 0, y: 0 }
  private raf: number | undefined
  SCALE_RATIO = 0.4
  MAGNIFY_RADIUS = 30

  constructor(magnifyCanvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, contentCanvas: HTMLCanvasElement, targetEl: HTMLElement) {
    this.magnifyCanvas = magnifyCanvas
    this.magnifyCanvas.width = this.MAGNIFY_RADIUS * 2
    this.magnifyCanvas.height = this.MAGNIFY_RADIUS * 2
    this.magnifyContext = ctx
    this.contentCanvas = contentCanvas
    this.targetEl = targetEl

    this.bind()
  }

  get brushSize():number {
    return store.getters['bgRemove/getBrushSize']
  }

  private bind(): void {
    window.addEventListener('pointermove', this.render.bind(this))
  }

  render(event: PointerEvent): void {
    this.posInMagnifierCanvas = mouseUtils.getMousePosInTarget(event, this.targetEl)
    this.clear()
    // this.context.save()

    // Why I multiply 1.2? Because I want to make the preview size a little bit bigger
    const scale = this.brushSize / (this.MAGNIFY_RADIUS * 2) * 1.5

    // use save and restore to avoid the influence of the following draw content(which will be clip if we didn't used save and restore)
    this.magnifyContext.save()
    this.magnifyContext.scale(1 / scale, 1 / scale)
    this.magnifyContext.drawImage(this.contentCanvas, -this.posInMagnifierCanvas.x + (this.MAGNIFY_RADIUS * scale), -this.posInMagnifierCanvas.y + (this.MAGNIFY_RADIUS * scale), this.contentCanvas.width, this.contentCanvas.height)

    this.magnifyContext.restore()
  }

  clear(): void {
    this.magnifyContext.clearRect(0, 0, this.magnifyCanvas.width, this.magnifyCanvas.height)
  }

  reset(): void {
    window.cancelAnimationFrame(this.raf!)
    this.magnifyContext.clearRect(0, 0, this.magnifyCanvas.width, this.magnifyCanvas.height)
  }
}

export default MagnifyUtils
