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
    canvas(class="bg-remove-area" ref="canvas")
    div(class="bg-remove-area__brush" :style="brushStyle")
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
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  props: {
    editorView: HTMLElement
  },
  data() {
    return {
      canvasWidth: 1600,
      canvasHeight: 1600,
      canvas: undefined as unknown as HTMLCanvasElement,
      ctx: undefined as unknown as CanvasRenderingContext2D,
      initImgCanvas: undefined as unknown as HTMLCanvasElement,
      initImgCtx: undefined as unknown as CanvasRenderingContext2D,
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
      blurPx: 5
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
    }

    this.initImageElement = new Image()
    this.initImageElement.src = this.initImgSrc
    this.initImageElement.setAttribute('crossOrigin', 'Anonymous')
    // this.initImageElement.onload = () => {
    //   this.initCanvas()
    // }
    this.editorView.addEventListener('mousedown', this.drawStart)
    window.addEventListener('mousemove', this.brushMoving)
    window.addEventListener('keydown', this.handleKeydown)
    this.setPrevPageScaleRatio(this.scaleRatio)
    pageUtils.fitPage()
  },
  destroyed() {
    window.removeEventListener('mouseup', this.drawEnd)
    window.removeEventListener('mousemove', this.brushMoving)
    this.editorView.removeEventListener('mousedown', this.drawStart)
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
      loading: 'bgRemove/getLoading'
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
      this.brushStyle.width = `${newVal}px`
      this.brushStyle.height = `${newVal}px`
      if (this.clearMode) {
        if (newVal > 25) {
          this.blurPx = 5
          this.ctx.filter = `blur(${this.blurPx}px)`
        } else if (newVal <= 25 && newVal >= 3) {
          this.blurPx = 2
          this.ctx.filter = `blur(${this.blurPx}px)`
        } else {
          this.blurPx = 1
          this.ctx.filter = `blur(${this.blurPx}px)`
        }
      }
    },
    restoreInitState(newVal) {
      if (newVal) {
        this.clearCtx()
        if (this.clearMode) {
          this.ctx.filter = 'none'
          this.drawImageToCtx()
          this.ctx.filter = `blur(${this.blurPx}px)`
        } else {
          this.ctx.filter = 'none'
          this.drawImageToCtx()
        }
        this.setRestoreInitState(false)
        this.setModifiedFlag(false)
        this.pushStep()
      }
    },
    clearMode(newVal) {
      if (newVal) {
        this.ctx.globalCompositeOperation = 'destination-out'
        this.ctx.filter = `blur(${this.blurPx}px)`
      } else {
        this.ctx.globalCompositeOperation = 'source-over'
        this.ctx.filter = 'none'
      }
    },
    brushColor(newVal) {
      this.brushStyle.backgroundColor = newVal
    }
  },
  methods: {
    ...mapMutations({
      setRestoreInitState: 'bgRemove/SET_restoreInitState',
      _setCanvas: 'bgRemove/SET_canvas',
      setModifiedFlag: 'bgRemove/SET_modifiedFlag',
      addStep: 'bgRemove/ADD_step',
      setCurrStep: 'bgRemove/SET_currStep',
      setPrevPageScaleRatio: 'bgRemove/SET_prevPageScaleRatio'
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

      if (!this.modifiedFlag) {
        this.setModifiedFlag(true)
      }
    },
    drawStart(e: MouseEvent) {
      const { x, y } = mouseUtils.getMousePosInPage(e, -1)
      Object.assign(this.initPos, {
        x,
        y
      })
      if (this.clearMode) {
        this.drawLine(e, this.ctx)
      } else {
        this.createInitImageCtx()
        this.drawLine(e, this.initImgCtx)
        this.ctx.drawImage(this.initImgCanvas, 0, 0, this.size.width, this.size.height)
      }
      window.addEventListener('mouseup', this.drawEnd)
      window.addEventListener('mousemove', this.drawing)
    },
    drawing(e: MouseEvent) {
      if (this.clearMode) {
        this.drawLine(e, this.ctx)
      } else {
        this.createInitImageCtx()
        this.drawLine(e, this.initImgCtx)
        this.ctx.drawImage(this.initImgCanvas, 0, 0, this.size.width, this.size.height)
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
      this.brushStyle.left = `${x - this.brushSize / 2}px`
      this.brushStyle.top = `${y - this.brushSize / 2}px`
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
    clearCtx(ctx?: CanvasRenderingContext2D) {
      const targetCtx = ctx ?? this.ctx

      targetCtx.clearRect(0, 0, this.size.width, this.size.height)
    },
    drawImageToInitImgCanvas() {
      this.initImgCtx.drawImage(this.initImageElement as HTMLImageElement, 0, 0, this.size.width, this.size.height)
      this.setCompositeOperationMode('destination-in', this.initImgCtx)
    },
    setCompositeOperationMode(mode: string, ctx?: CanvasRenderingContext2D) {
      if (ctx) {
        ctx.globalCompositeOperation = mode
      } else {
        this.ctx.globalCompositeOperation = mode
      }
    },
    pushStep() {
      const base64 = this.canvas.toDataURL()
      this.addStep(base64)
    },
    handleKeydown(e: KeyboardEvent) {
      if (!e.repeat && (e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        this.undo()
      }
      if (!e.repeat && (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        this.redo()
      }
    },
    undo() {
      this.setCurrStep(Math.max(this.currStep - 1, 0))
      const img = new Image()
      img.src = this.steps[this.currStep]
      img.onload = () => {
        this.clearCtx()
        this.ctx.filter = 'none'
        this.drawImageToCtx(img)
        this.ctx.filter = `blur(${this.blurPx}px)`
      }
    },
    redo() {
      this.setCurrStep(Math.min(this.currStep + 1, this.steps.length - 1))
      const img = new Image()
      img.src = this.steps[this.currStep]

      img.onload = () => {
        this.clearCtx()
        this.ctx.filter = 'none'
        this.drawImageToCtx(img)
        this.ctx.filter = `blur(${this.blurPx}px)`
      }
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
