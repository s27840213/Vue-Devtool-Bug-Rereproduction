<template lang="pug">
div(class="bg-remove-area"
      :style="wrapperStyles"
      ref="bgRemoveArea")
  div(v-show="showInitImage"
    class="bg-remove-area__initPhoto"
    :style="initPhotoStyles")
  div(class="bg-remove-area__scale-area"
      :style="areaStyles"
      :class="{'bg-remove-area__scale-area--hideBg': !showInitImage}")
    canvas(class="bg-remove-area" ref="canvas" :cy-ready="cyReady")
    div(v-if="showBrush" class="bg-remove-area__brush" :style="brushStyle")
  div(v-if="loading" class="bg-remove-area__loading")
    svg-icon(class="spiner"
      :iconName="'spiner'"
      :iconColor="'white'"
      :iconWidth="'150px'")
teleport(v-if="useMobileEditor" to=".header-bar")
  div(class="magnify-area" :style="magnifyAreaStyle")
    canvas(class="magnify-area__canvas"  ref="magnify")
    div(class="magnify-area__brush" :style="{backgroundColor: brushColor}")
</template>

<script lang="ts">
import { IBgRemoveInfo } from '@/interfaces/image'
import MagnifyUtils from '@/utils/magnifyUtils'
import mouseUtils from '@/utils/mouseUtils'
import pageUtils from '@/utils/pageUtils'
import shortcutUtils from '@/utils/shortcutUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  emits: [],
  props: {
    editorViewCanvas: {
      type: HTMLElement,
      required: true
    }
  },
  data() {
    return {
      cyReady: false,
      root: undefined as unknown as HTMLElement,
      canvasWidth: 1600,
      canvasHeight: 1600,
      contentCanvas: undefined as unknown as HTMLCanvasElement,
      contentCtx: undefined as unknown as CanvasRenderingContext2D,
      initImgCanvas: undefined as unknown as HTMLCanvasElement,
      initImgCtx: undefined as unknown as CanvasRenderingContext2D,
      blurCanvas: undefined as unknown as HTMLCanvasElement,
      blurCtx: undefined as unknown as CanvasRenderingContext2D,
      clearModeCanvas: undefined as unknown as HTMLCanvasElement,
      clearModeCtx: undefined as unknown as CanvasRenderingContext2D,
      magnifyCanvas: undefined as unknown as HTMLCanvasElement,
      magnifyCtx: undefined as unknown as CanvasRenderingContext2D,
      initImageElement: undefined as unknown as HTMLImageElement,
      imageElement: undefined as unknown as HTMLImageElement,
      initPos: { x: 0, y: 0 },
      brushStyle: {
        backgroundColor: '#fcaea9',
        width: '16px',
        height: '16px',
        transform: 'translate(0,0)'
      },
      initImgSrc: '',
      imgSrc: '',
      blurPx: 1,
      showBrush: false,
      stepsQueue: [] as Array<Promise<unknown>>,
      isProcessingStepsQueue: false,
      currCanvasImageElement: undefined as unknown as HTMLImageElement,
      magnifyUtils: null as unknown as MagnifyUtils,
      showMagnifyAtRight: false,
      clearModeShift: 4
    }
  },
  created() {
    const { width, height } = (this.autoRemoveResult as IBgRemoveInfo)
    const aspectRatio = width / height
    this.canvasHeight = 1600 / aspectRatio
    this.initImgSrc = (this.autoRemoveResult as IBgRemoveInfo).initSrc
    this.imgSrc = (this.autoRemoveResult as IBgRemoveInfo).urls.larg
  },
  mounted() {
    this.root = this.$refs.bgRemoveArea as HTMLElement

    this.imageElement = new Image()
    this.imageElement.src = this.imgSrc
    this.imageElement.setAttribute('crossOrigin', 'Anonymous')
    this.imageElement.onload = () => {
      this.initCanvas()
      this.initBlurCanvas()
      this.initClearModeCanvas()
      this.$isTouchDevice() && this.initMagnifyCanvas()
      this.cyReady = true
    }

    this.initImageElement = new Image()
    this.initImageElement.src = this.initImgSrc
    this.initImageElement.setAttribute('crossOrigin', 'Anonymous')
    this.initImageElement.onload = () => {
      this.createInitImageCtx()
    }
    this.editorViewCanvas.addEventListener('pointerdown', this.drawStart)
    window.addEventListener('pointermove', this.setBrushPos)
    if (!this.$isTouchDevice()) {
      this.editorViewCanvas.addEventListener('mouseenter', this.handleBrushEnter)
      this.editorViewCanvas.addEventListener('mouseleave', this.handleBrushLeave)
    }
    window.addEventListener('keydown', this.handleKeydown)
    this.setPrevPageScaleRatio(this.scaleRatio)
    pageUtils.fitPage()
  },
  unmounted() {
    window.removeEventListener('pointerup', this.drawEnd)
    window.removeEventListener('pointermove', this.setBrushPos)
    window.removeEventListener('pointermove', this.drawing)
    this.editorViewCanvas.removeEventListener('mouseenter', this.handleBrushEnter)
    this.editorViewCanvas.removeEventListener('mouseleave', this.handleBrushLeave)
    this.editorViewCanvas.removeEventListener('pointerdown', this.drawStart)
    window.removeEventListener('keydown', this.handleKeydown)
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo',
      brushSize: 'bgRemove/getBrushSize',
      restoreInitState: 'bgRemove/getRestoreInitState',
      clearMode: 'bgRemove/getClearMode',
      showInitImage: 'bgRemove/getShowInitImage',
      autoRemoveResult: 'bgRemove/getAutoRemoveResult',
      modifiedFlag: 'bgRemove/getModifiedFlag',
      steps: 'bgRemove/getSteps',
      currStep: 'bgRemove/getCurrStep',
      inLastStep: 'bgRemove/inLastStep',
      inFirstStep: 'bgRemove/inFirstStep',
      loading: 'bgRemove/getLoading',
      inGestureMode: 'getInGestureToolMode',
      contentScaleRatio: 'getContentScaleRatio',
      useMobileEditor: 'getUseMobileEditor'
    }),
    size(): { width: number, height: number } {
      return {
        width: this.canvasWidth,
        height: this.canvasHeight
      }
    },
    areaStyles(): { [index: string]: string } {
      const { width, height } = this.size

      return {
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${this.scaleRatio * this.contentScaleRatio / 100})`
      }
    },
    wrapperStyles(): { [index: string]: string } {
      return {
        width: `${this.size.width * (this.scaleRatio * this.contentScaleRatio / 100)}px`,
        height: `${this.size.height * (this.scaleRatio * this.contentScaleRatio / 100)}px`
      }
    },
    initPhotoStyles(): { [index: string]: string } {
      const backgroundImage = this.showInitImage ? `url(${this.initImgSrc})` : ''
      const backgroundSize = this.showInitImage ? 'cover' : 'initial'
      return {
        width: `${this.size.width * (this.scaleRatio * this.contentScaleRatio / 100)}px`,
        height: `${this.size.height * (this.scaleRatio * this.contentScaleRatio / 100)}px`,
        backgroundImage,
        backgroundSize
      }
    },
    brushColor(): string {
      return this.clearMode ? '#fcaea9' : '#fdd033'
    },
    magnifyAreaStyle(): { [index: string]: string } {
      return !this.$isTouchDevice() ? {
        bottom: '10px',
        left: '80px'
      } : {
        bottom: '-70px',
        ...(this.showMagnifyAtRight ? { right: '10px' } : { left: '10px' }),
        visibility: this.showBrush ? 'visible' : 'hidden'
      }
    }
  },
  watch: {
    brushSize(newVal: number) {
      this.contentCtx.lineWidth = newVal
      this.blurCtx.lineWidth = newVal
      this.clearModeCtx.lineWidth = newVal
      this.brushStyle.width = `${newVal + this.blurPx}px`
      this.brushStyle.height = `${newVal + this.blurPx}px`
      if (this.clearMode) {
        this.blurPx = 1
        this.contentCtx.filter = `blur(${this.blurPx}px)`
      }
    },
    restoreInitState(newVal) {
      if (newVal) {
        this.clearCtx()
        this.initClearModeCanvas()
        if (this.clearMode) {
          this.contentCtx.filter = 'none'
          this.drawImageToCtx()
          this.contentCtx.filter = `blur(${this.blurPx}px)`
        } else {
          this.contentCtx.filter = 'none'
          this.drawImageToCtx()
        }
        this.clearSteps()
        this.setRestoreInitState(false)
        this.setModifiedFlag(false)
        this.pushStep()
        this.$isTouchDevice() && this.magnifyUtils.reset()
        this.currCanvasImageElement = undefined as unknown as HTMLImageElement
      }
    },
    clearMode(newVal) {
      if (newVal) {
        this.contentCtx.globalCompositeOperation = 'destination-out'
        this.contentCtx.filter = `blur(${this.blurPx}px)`
        this.initClearModeCanvas()
        this.updateCurrCanvasImageElement()
      } else {
        this.contentCtx.globalCompositeOperation = 'source-over'
        this.contentCtx.filter = 'none'
      }
    },
    brushColor(newVal) {
      this.brushStyle.backgroundColor = newVal
    },
    stepsQueue: {
      async handler(newVal, oldVal) {
        /** step being pushed */
        if (this.isProcessingStepsQueue) {
          return
        }
        while (this.stepsQueue.length !== 0) {
          this.isProcessingStepsQueue = true
          const blob = await this.stepsQueue.shift()
          if (blob) {
            this.addStep(blob)
          }
        }

        this.isProcessingStepsQueue = false
      },
      deep: true
    }
  },
  methods: {
    ...mapMutations({
      setRestoreInitState: 'bgRemove/SET_restoreInitState',
      _setCanvas: 'bgRemove/SET_canvas',
      setModifiedFlag: 'bgRemove/SET_modifiedFlag',
      addStep: 'bgRemove/ADD_step',
      setCurrStep: 'bgRemove/SET_currStep',
      setPrevPageScaleRatio: 'bgRemove/SET_prevPageScaleRatio',
      clearSteps: 'bgRemove/CLEAR_steps'
    }),
    initCanvas() {
      this.contentCanvas = this.$refs.canvas as HTMLCanvasElement
      this.contentCanvas.width = this.canvasWidth
      this.contentCanvas.height = this.canvasHeight
      const ctx = this.contentCanvas.getContext('2d') as CanvasRenderingContext2D
      ctx.strokeStyle = 'red'
      ctx.lineWidth = this.brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      this.contentCtx = ctx
      // this.ctx.globalCompositeOperation = 'destination-out'

      this.drawImageToCtx()
      this.contentCtx.filter = `blur(${this.blurPx}px)`
      this.pushStep()
    },
    initBlurCanvas() {
      this.blurCanvas = document.createElement('canvas') as HTMLCanvasElement
      this.blurCanvas.width = this.size.width
      this.blurCanvas.height = this.size.height
      const ctx = this.blurCanvas.getContext('2d') as CanvasRenderingContext2D
      // set up drawing settings
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = this.brushSize
      ctx.filter = `blur(${this.blurPx}px)`

      this.blurCtx = ctx
    },
    initClearModeCanvas() {
      this.clearModeCanvas = document.createElement('canvas') as HTMLCanvasElement
      this.clearModeCanvas.width = this.size.width + 2 * this.clearModeShift
      this.clearModeCanvas.height = this.size.height + 2 * this.clearModeShift
      const ctx = this.clearModeCanvas.getContext('2d') as CanvasRenderingContext2D
      // set up drawing settings
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = this.brushSize

      this.clearModeCtx = ctx
    },
    initMagnifyCanvas() {
      this.magnifyCanvas = this.$refs.magnify as HTMLCanvasElement
      const ctx = this.magnifyCanvas.getContext('2d') as CanvasRenderingContext2D

      this.magnifyCtx = ctx

      this.magnifyUtils = new MagnifyUtils(this.magnifyCanvas, this.magnifyCtx, this.contentCanvas, this.root)
    },
    createInitImageCtx() {
      this.initImgCanvas = document.createElement('canvas') as HTMLCanvasElement
      this.initImgCanvas.width = this.size.width
      this.initImgCanvas.height = this.size.height
      const ctx = this.initImgCanvas.getContext('2d') as CanvasRenderingContext2D
      // set up drawing settings
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = this.brushSize

      this.initImgCtx = ctx
      this.drawImageToInitImgCanvas()
    },
    drawLine(e: MouseEvent, ctx: CanvasRenderingContext2D) {
      const shift = this.clearMode ? this.clearModeShift : 0
      ctx.beginPath()
      ctx.moveTo(this.initPos.x + shift, this.initPos.y + shift)
      const { x, y, xPercentage, yPercentage } = mouseUtils.getMousePosInTarget(e, this.root)
      this.showMagnifyAtRight = xPercentage < 0.25 && yPercentage < 0.25
      ctx.lineTo(x + shift, y + shift)
      ctx.stroke()
      Object.assign(this.initPos, {
        x,
        y
      })

      this.setModifiedFlag(true)
    },
    drawStart(e: PointerEvent) {
      if (!this.inGestureMode) {
        const { x, y } = mouseUtils.getMousePosInTarget(e, this.root)
        Object.assign(this.initPos, {
          x,
          y
        })
        if (this.clearMode) {
          this.drawInClearMode(e)
        } else {
          this.drawInRestoreMode(e)
        }
        if (this.$isTouchDevice()) {
          this.showBrush = true
          this.setBrushPos(e)
          this.magnifyUtils.render(e)
        }
        window.addEventListener('pointerup', this.drawEnd)
        window.addEventListener('pointermove', this.drawing)
      }
    },
    drawing(e: MouseEvent) {
      if (this.clearMode) {
        this.drawInClearMode(e)
      } else {
        this.drawInRestoreMode(e)
      }
    },
    drawEnd() {
      window.removeEventListener('pointerup', this.drawEnd)
      window.removeEventListener('pointermove', this.drawing)
      this._setCanvas(this.contentCanvas)
      this.pushStep()
      if (this.$isTouchDevice()) {
        this.showBrush = false
      }
    },
    setBrushPos(e: MouseEvent) {
      const { x, y } = mouseUtils.getMousePosInTarget(e, this.root)
      this.brushStyle.transform = `translate(${x - (this.brushSize + this.blurPx) / 2}px, ${y - (this.brushSize + this.blurPx) / 2}px)`
    },
    drawImageToCtx(img?: HTMLImageElement) {
      this.setCompositeOperationMode('source-over')
      this.contentCtx.drawImage(img ?? this.imageElement, 0, 0, this.size.width, this.size.height)
      this._setCanvas(this.contentCanvas)
      if (this.clearMode) {
        this.setCompositeOperationMode('destination-out')
      } else {
        this.setCompositeOperationMode('source-over')
      }
    },
    drawInClearMode(e: MouseEvent) {
      this.cyReady = false
      this.setCompositeOperationMode('source-over', this.contentCtx)
      this.contentCtx.filter = 'none'
      this.clearCtx(this.contentCtx)
      this.contentCtx.drawImage(this.currCanvasImageElement ?? this.imageElement, 0, 0, this.size.width, this.size.height)
      // this.ctx.drawImage(this.imageElement, 0, 0, this.size.width, this.size.height)

      this.drawLine(e, this.clearModeCtx)
      this.setCompositeOperationMode('destination-out')
      this.contentCtx.filter = `blur(${this.blurPx}px)`
      this.contentCtx.drawImage(this.clearModeCanvas, 0 - this.clearModeShift, 0 - this.clearModeShift, this.size.width + 2 * this.clearModeShift, this.size.height + 2 * this.clearModeShift)
      this.cyReady = true
    },
    drawInRestoreMode(e: MouseEvent) {
      this.clearCtx(this.blurCtx)
      this.drawLine(e, this.blurCtx)
      this.setCompositeOperationMode('source-in', this.blurCtx)
      this.blurCtx.filter = 'none'
      this.blurCtx.drawImage(this.initImgCanvas, 0, 0, this.size.width, this.size.height)

      this.setCompositeOperationMode('source-over', this.blurCtx)
      this.blurCtx.filter = `blur(${this.blurPx}px)`
      this.contentCtx.drawImage(this.blurCanvas, 0, 0, this.size.width, this.size.height)
    },
    clearCtx(ctx?: CanvasRenderingContext2D) {
      const targetCtx = ctx ?? this.contentCtx

      targetCtx.clearRect(0, 0, this.size.width, this.size.height)
    },
    drawImageToInitImgCanvas() {
      this.initImgCtx.drawImage(this.initImageElement as HTMLImageElement, 0, 0, this.size.width, this.size.height)
      this.setCompositeOperationMode('destination-in', this.initImgCtx)
    },
    setCompositeOperationMode(mode: string, ctx?: CanvasRenderingContext2D) {
      /**
       * @Note GlobalCompositeOperation type has some problems
       */
      if (ctx) {
        ctx.globalCompositeOperation = mode as any
      } else {
        this.contentCtx.globalCompositeOperation = mode as any
      }
    },
    getCanvasBlob(mycanvas: HTMLCanvasElement) {
      return new Promise((resolve, reject) => {
        mycanvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/png')
      })
    },
    pushStep() {
      /**
       * DataUrl for png is TOO slow for the project, so I change to use the toBlob method
       */
      // const base64 = this.canvas.toDataURL('image/png', 0.3)
      // this.addStep(base64)
      const blob = this.getCanvasBlob(this.contentCanvas)

      this.stepsQueue.push(blob)
    },
    handleKeydown(e: KeyboardEvent) {
      if (!e.repeat) {
        if ((e.ctrlKey || e.metaKey)) {
          if (e.shiftKey) {
            if ((e.key === 'z' || e.key === 'Z')) {
              e.preventDefault()
              this.redo()
            }
          } else if ((e.key === 'z' || e.key === 'Z')) {
            e.preventDefault()
            this.undo()
          } else if (e.key === '=') {
            e.preventDefault()
            shortcutUtils.zoomIn()
          } else if (e.key === '-') {
            e.preventDefault()
            shortcutUtils.zoomOut()
          }
        }
      }
    },
    updateCurrCanvasImageElement(blob?: Blob) {
      if (!this.currCanvasImageElement) {
        this.currCanvasImageElement = new Image()
      }
      const url = URL.createObjectURL(blob ?? this.steps[this.currStep])
      this.currCanvasImageElement.src = URL.createObjectURL(blob ?? this.steps[this.currStep])
      return url
    },
    undo() {
      if (!this.isProcessingStepsQueue) {
        this.setCurrStep(Math.max(this.currStep - 1, 0))
        const url = this.updateCurrCanvasImageElement()

        this.currCanvasImageElement.onload = () => {
          this.clearCtx()
          this.clearModeCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
          this.contentCtx.filter = 'none'
          this.drawImageToCtx(this.currCanvasImageElement)
          if (this.clearMode) {
            this.contentCtx.filter = `blur(${this.blurPx}px)`
          }

          URL.revokeObjectURL(url)
        }
      }
    },
    redo() {
      if (!this.isProcessingStepsQueue) {
        this.setCurrStep(Math.min(this.currStep + 1, this.steps.length - 1))
        this.updateCurrCanvasImageElement()

        this.currCanvasImageElement.onload = () => {
          this.clearCtx()
          this.contentCtx.filter = 'none'
          this.drawImageToCtx(this.currCanvasImageElement)
          if (this.clearMode) {
            this.contentCtx.filter = `blur(${this.blurPx}px)`
          }
        }
      }
    },
    handleBrushEnter() {
      this.showBrush = true
    },
    handleBrushLeave() {
      this.showBrush = false
    }
  }
})
</script>

<style lang="scss" scoped>
.bg-remove-area {
  position: relative;
  box-sizing: content-box;
  margin: 0px auto;
  overflow: hidden;

  &__initPhoto {
    position: absolute;
    top: 0;
    left: 0;
  }
  &__scale-area {
    position: relative;
    box-sizing: border-box;
    transform-origin: 0 0;
    background-color: rgba(255, 255, 255, 0.5);
    &--hideBg {
      background-image: linear-gradient(
          45deg,
          setColor(gray-5) 25%,
          rgba(0, 0, 0, 0) 25%,
          rgba(0, 0, 0, 0) 75%,
          setColor(gray-5) 75%,
          setColor(gray-5)
        ),
        linear-gradient(
          45deg,
          setColor(gray-5) 25%,
          rgba(0, 0, 0, 0) 25%,
          rgba(0, 0, 0, 0) 75%,
          setColor(gray-5) 75%,
          setColor(gray-5)
        );
      background-color: rgb(255, 255, 255);
      background-position: 0px 0px, 40px 40px;
      background-size: 80px 80px;
    }
  }

  &__brush {
    position: absolute;
    top: 0px;
    left: 0px;
    pointer-events: none;
    border-radius: 50%;
    opacity: 0.6;
    will-change: left, top;
  }

  &__loading {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: setColor(gray-1, 0.3);
  }
}

.magnify-area {
  position: absolute;
  width: 60px;
  height: 60px;
  overflow:hidden;
  transform-origin: top left;
  border: 1px solid setColor(gray-2);
  border-radius: 8px;
  box-sizing: border-box;
  pointer-events: none;
  background-color: setColor(gray-6);

  &__brush {
    position: absolute;
    width: calc(100% *  (2/3) + 3px);
    height: calc(100% *  (2/3) + 3px);
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
    opacity: 0.7;
    box-sizing: border-box;
    border-radius: 50%;
    z-index: setZindex('popup');
  }
}

.spiner {
  animation: rotation 0.5s infinite linear;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
