import mouseUtils from '@/utils/mouseUtils'

class MagnifyUtils {
  private magnifyCanvas: HTMLCanvasElement;
  private contentCanvas: HTMLCanvasElement;
  private targetEl: HTMLElement;
  private magnifyContext: CanvasRenderingContext2D;
  private point = { x: 0, y: 0 };
  private distPoint = { x: 0, y: 0 };
  private pos = { x: 0, y: 0 };
  private raf: number | undefined;
  SCALE_RATIO = 0.4
  MAGNIFY_SIZE =60

  constructor(magnifyCanvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, contentCanvas: HTMLCanvasElement, targetEl: HTMLElement) {
    this.magnifyCanvas = magnifyCanvas
    this.magnifyCanvas.width = this.MAGNIFY_SIZE * 2
    this.magnifyCanvas.height = this.MAGNIFY_SIZE * 2
    this.magnifyContext = ctx
    this.contentCanvas = contentCanvas
    this.targetEl = targetEl

    this.bind()
  }

  private bind(): void {
    window.addEventListener('mousemove', this.onMouseMove.bind(this))

    window.addEventListener('touchmove', this.onTouchMove.bind(this))
  }

  private render(): void {
    this.clear()
    // this.context.save()

    this.pos.x += (this.point.x - this.pos.x) * 0.2
    this.pos.y += (this.point.y - this.pos.y) * 0.2

    this.magnifyContext.drawImage(this.contentCanvas, -this.pos.x + this.MAGNIFY_SIZE, -this.pos.y + this.MAGNIFY_SIZE, this.contentCanvas.width, this.contentCanvas.height)
    // use save and restore to avoid the influence of the following draw content(which will be clip if we didn't used save and restore)
    this.magnifyContext.save()
    // this.magnifyContext.beginPath()
    // this.magnifyContext.arc(this.MAGNIFY_SIZE, this.MAGNIFY_SIZE, this.MAGNIFY_SIZE, 0, Math.PI * 2, true)
    // this.magnifyContext.strokeStyle = 'black'
    // this.magnifyContext.lineWidth = 6
    // this.magnifyContext.stroke()
    // this.magnifyContext.closePath()
    // // will clip the following draw content
    // this.magnifyContext.clip()

    // this.magnifyContext.drawImage(
    //   this.contentCanvas,
    //   -this.magnifyCanvas.width * (this.SCALE_RATIO / 2) +
    //     (this.magnifyCanvas.width - this.magnifyCanvas.width * (1 + this.SCALE_RATIO)) * (this.distPoint.x * 1), // 0.05,
    //   -this.magnifyCanvas.height * (this.SCALE_RATIO / 2) +
    //     (this.magnifyCanvas.height - this.magnifyCanvas.height * (1 + this.SCALE_RATIO)) * (this.distPoint.y * 1), // 0.05,
    //   this.magnifyCanvas.width * (1 + this.SCALE_RATIO),
    //   this.magnifyCanvas.height * (1 + this.SCALE_RATIO)
    // )

    // this.magnifyContext.drawImage(
    //   this.contentCanvas,
    //   -this.magnifyCanvas.width * (this.SCALE_RATIO / 2) +
    //     (this.magnifyCanvas.width - this.magnifyCanvas.width * (1 + this.SCALE_RATIO)) * (this.distPoint.x * 1), // 0.05,
    //   -this.magnifyCanvas.height * (this.SCALE_RATIO / 2) +
    //     (this.magnifyCanvas.height - this.magnifyCanvas.height * (1 + this.SCALE_RATIO)) * (this.distPoint.y * 1), // 0.05,
    //   this.magnifyCanvas.width * (1 + this.SCALE_RATIO),
    //   this.magnifyCanvas.height * (1 + this.SCALE_RATIO)
    // )
    // this.context.opacity = 1;

    this.magnifyContext.restore()
  }

  private onMouseMove(ev: MouseEvent): void {
    // const rect = this.canvas.getBoundingClientRect()
    // this.point = {
    //   x: (ev.clientX - 7) - rect.left,
    //   y: (ev.clientY - 7) - rect.top
    // }
    this.point = mouseUtils.getMousePosInTarget(ev, this.targetEl)

    this.distPoint = {
      x: (this.point.x - this.magnifyCanvas.width * 0.5) / this.magnifyCanvas.width,
      y: (this.point.y - this.magnifyCanvas.height * 0.5) / this.magnifyCanvas.height
    }

    this.render()
  }

  onTouchMove(ev: TouchEvent): void {
    const rect = this.magnifyCanvas.getBoundingClientRect()
    this.point = {
      x: ev.touches[0].clientX - rect.left,
      y: ev.touches[0].clientY - rect.top
    }

    this.distPoint = {
      x: (this.point.x - this.magnifyCanvas.width * 0.5) / this.magnifyCanvas.width,
      y: (this.point.y - this.magnifyCanvas.height * 0.5) / this.magnifyCanvas.height
    }

    this.render()
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
