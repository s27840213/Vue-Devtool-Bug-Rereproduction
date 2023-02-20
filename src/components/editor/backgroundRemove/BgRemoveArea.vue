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
    canvas(class="bg-remove-area" ref="canvas" :cy-ready="initialized")
    div(v-if="showBrush" class="bg-remove-area__brush" :style="brushStyle")
  div(v-if="loading" class="bg-remove-area__loading")
    svg-icon(class="spiner"
      :iconName="'spiner'"
      :iconColor="'white'"
      :iconWidth="'150px'")
</template>

<script lang="ts">
import { IBgRemoveInfo } from '@/interfaces/image'
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
      initialized: false,
      canvasWidth: 1600,
      canvasHeight: 1600,
      canvas: undefined as unknown as HTMLCanvasElement,
      ctx: undefined as unknown as CanvasRenderingContext2D,
      initImgCanvas: undefined as unknown as HTMLCanvasElement,
      initImgCtx: undefined as unknown as CanvasRenderingContext2D,
      blurCanvas: undefined as unknown as HTMLCanvasElement,
      blurCtx: undefined as unknown as CanvasRenderingContext2D,
      clearModeCanvas: undefined as unknown as HTMLCanvasElement,
      clearModeCtx: undefined as unknown as CanvasRenderingContext2D,
      initImageElement: undefined as unknown as HTMLImageElement,
      imageElement: undefined as unknown as HTMLImageElement,
      initPos: { x: 0, y: 0 },
      brushStyle: {
        top: '0px',
        left: '0px',
        backgroundColor: '#fcaea9',
        width: '16px',
        height: '16px'
      },
      isMouseDown: false,
      initImgSrc: '',
      imgSrc: '',
      blurPx: 1,
      showBrush: false,
      stepsQueue: [] as Array<Promise<unknown>>,
      isProcessingStepsQueue: false,
      currCanvasImageElement: undefined as unknown as HTMLImageElement,
      brushSteps: []
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
    this.imageElement = new Image()
    this.imageElement.src = this.imgSrc
    this.imageElement.setAttribute('crossOrigin', 'Anonymous')
    this.imageElement.onload = () => {
      this.initCanvas()
      this.initBlurCanvas()
      this.initClearModeCanvas()
    }

    this.initImageElement = new Image()
    this.initImageElement.src = this.initImgSrc
    this.initImageElement.setAttribute('crossOrigin', 'Anonymous')
    this.initImageElement.onload = () => {
      this.createInitImageCtx()
    }
    this.editorViewCanvas.addEventListener('mousedown', this.drawStart)
    this.editorViewCanvas.addEventListener('mouseenter', this.handleBrushEnter)
    this.editorViewCanvas.addEventListener('mouseleave', this.handleBrushLeave)
    window.addEventListener('mousemove', this.brushMoving)
    window.addEventListener('keydown', this.handleKeydown)
    this.setPrevPageScaleRatio(this.scaleRatio)
    pageUtils.fitPage()
  },
  unmounted() {
    window.removeEventListener('mouseup', this.drawEnd)
    window.removeEventListener('mousemove', this.brushMoving)
    this.editorViewCanvas.removeEventListener('mouseenter', this.handleBrushEnter)
    this.editorViewCanvas.removeEventListener('mouseleave', this.handleBrushLeave)
    this.editorViewCanvas.removeEventListener('mousedown', this.drawStart)
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
      inGestureMode: 'getInGestureToolMode'
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
        transform: `scale(${this.scaleRatio / 100})`
      }
    },
    wrapperStyles(): { [index: string]: string } {
      return {
        width: `${this.size.width * (this.scaleRatio / 100)}px`,
        height: `${this.size.height * (this.scaleRatio / 100)}px`
      }
    },
    initPhotoStyles(): { [index: string]: string } {
      const backgroundImage = this.showInitImage ? `url(${this.initImgSrc})` : ''
      const backgroundSize = this.showInitImage ? 'cover' : 'initial'
      return {
        width: `${this.size.width * (this.scaleRatio / 100)}px`,
        height: `${this.size.height * (this.scaleRatio / 100)}px`,
        backgroundImage,
        backgroundSize
      }
    },
    brushColor(): string {
      return this.clearMode ? '#fcaea9' : '#fdd033'
    }
  },
  watch: {
    brushSize(newVal: number) {
      this.ctx.lineWidth = newVal
      this.blurCtx.lineWidth = newVal
      this.clearModeCtx.lineWidth = newVal
      this.brushStyle.width = `${newVal + this.blurPx}px`
      this.brushStyle.height = `${newVal + this.blurPx}px`
      if (this.clearMode) {
        this.blurPx = 1
        this.ctx.filter = `blur(${this.blurPx}px)`
      }
    },
    restoreInitState(newVal) {
      if (newVal) {
        this.clearCtx()
        this.initClearModeCanvas()
        if (this.clearMode) {
          this.ctx.filter = 'none'
          this.drawImageToCtx()
          this.ctx.filter = `blur(${this.blurPx}px)`
        } else {
          this.ctx.filter = 'none'
          this.drawImageToCtx()
        }
        this.clearSteps()
        this.setRestoreInitState(false)
        this.setModifiedFlag(false)
        this.pushStep()

        this.currCanvasImageElement = undefined as unknown as HTMLImageElement
      }
    },
    clearMode(newVal) {
      if (newVal) {
        this.ctx.globalCompositeOperation = 'destination-out'
        this.ctx.filter = `blur(${this.blurPx}px)`
        this.initClearModeCanvas()
        this.updateCurrCanvasImageElement()
      } else {
        this.ctx.globalCompositeOperation = 'source-over'
        this.ctx.filter = 'none'
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
      this.canvas = this.$refs.canvas as HTMLCanvasElement
      this.canvas.width = this.canvasWidth
      this.canvas.height = this.canvasHeight
      const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
      ctx.strokeStyle = 'red'
      ctx.lineWidth = this.brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      this.ctx = ctx
      // this.ctx.globalCompositeOperation = 'destination-out'

      this.drawImageToCtx()
      this.ctx.filter = `blur(${this.blurPx}px)`
      this.pushStep()
      this.initialized = true
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
      this.clearModeCanvas.width = this.size.width
      this.clearModeCanvas.height = this.size.height
      const ctx = this.clearModeCanvas.getContext('2d') as CanvasRenderingContext2D
      // set up drawing settings
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = this.brushSize

      this.clearModeCtx = ctx
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
      ctx.beginPath()
      ctx.moveTo(this.initPos.x, this.initPos.y)
      const { x, y } = mouseUtils.getMousePosInPage(e, -1)
      ctx.lineTo(x, y)
      ctx.stroke()
      Object.assign(this.initPos, {
        x,
        y
      })

      this.setModifiedFlag(true)
    },
    drawStart(e: MouseEvent) {
      if (!this.inGestureMode) {
        const { x, y } = mouseUtils.getMousePosInPage(e, -1)
        Object.assign(this.initPos, {
          x,
          y
        })
        if (this.clearMode) {
          this.drawInClearMode(e)
        } else {
          this.drawInRestoreMode(e)
        }
        window.addEventListener('mouseup', this.drawEnd)
        window.addEventListener('mousemove', this.drawing)
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
      window.removeEventListener('mouseup', this.drawEnd)
      window.removeEventListener('mousemove', this.drawing)
      this._setCanvas(this.canvas)
      this.pushStep()
    },
    brushMoving(e: MouseEvent) {
      const { x, y } = mouseUtils.getMousePosInPage(e, -1)
      this.brushStyle.left = `${x - (this.brushSize + this.blurPx) / 2}px`
      this.brushStyle.top = `${y - (this.brushSize + this.blurPx) / 2}px`
    },
    drawImageToCtx(img?: HTMLImageElement) {
      this.setCompositeOperationMode('source-over')
      this.ctx.drawImage(img ?? this.imageElement, 0, 0, this.size.width, this.size.height)
      this._setCanvas(this.canvas)
      if (this.clearMode) {
        this.setCompositeOperationMode('destination-out')
      } else {
        this.setCompositeOperationMode('source-over')
      }
    },
    drawInClearMode(e: MouseEvent) {
      this.setCompositeOperationMode('source-over', this.ctx)
      this.ctx.filter = 'none'
      this.clearCtx(this.ctx)
      this.ctx.drawImage(this.currCanvasImageElement ?? this.imageElement, 0, 0, this.size.width, this.size.height)
      // this.ctx.drawImage(this.imageElement, 0, 0, this.size.width, this.size.height)

      this.drawLine(e, this.clearModeCtx)
      this.setCompositeOperationMode('destination-out')
      this.ctx.filter = `blur(${this.blurPx}px)`
      this.ctx.drawImage(this.clearModeCanvas, 0, 0, this.size.width, this.size.height)
    },
    drawInRestoreMode(e: MouseEvent) {
      this.clearCtx(this.blurCtx)
      this.drawLine(e, this.blurCtx)
      this.setCompositeOperationMode('source-in', this.blurCtx)
      this.blurCtx.filter = 'none'
      this.blurCtx.drawImage(this.initImgCanvas, 0, 0, this.size.width, this.size.height)

      this.setCompositeOperationMode('source-over', this.blurCtx)
      this.blurCtx.filter = `blur(${this.blurPx}px)`
      this.ctx.drawImage(this.blurCanvas, 0, 0, this.size.width, this.size.height)
    },
    clearCtx(ctx?: CanvasRenderingContext2D) {
      const targetCtx = ctx ?? this.ctx

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
        this.ctx.globalCompositeOperation = mode as any
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
      const blob = this.getCanvasBlob(this.canvas)

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
          this.ctx.filter = 'none'
          this.drawImageToCtx(this.currCanvasImageElement)
          if (this.clearMode) {
            this.ctx.filter = `blur(${this.blurPx}px)`
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
          this.ctx.filter = 'none'
          this.drawImageToCtx(this.currCanvasImageElement)
          if (this.clearMode) {
            this.ctx.filter = `blur(${this.blurPx}px)`
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
