import { PowerfulFillCanvasMode } from '@/types/editor'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import { pick } from 'lodash'
import { defineStore } from 'pinia'
export interface ICanvasState {
  canvasMode: PowerfulFillCanvasMode
  brushSize: number
  resultCanvas: HTMLCanvasElement
  loading: boolean
  isProcessingStepsQueue: boolean
  stepsQueue: Array<Promise<Blob | null>>
  steps: Array<Blob>
  currStep: number
  checkPointStep: number
  isChangingBrushSize: boolean
  isDrawing: boolean
  canvas: HTMLCanvasElement | null
  canvasCtx: CanvasRenderingContext2D | null
  currCanvasImageElement: HTMLImageElement
  isAutoFilling: boolean
  drawingColor: string
}

const defaultState = {
  canvasMode: 'brush',
  brushSize: 260,
  resultCanvas: null as unknown as HTMLCanvasElement,
  loading: false,
  isProcessingStepsQueue: false,
  stepsQueue: [],
  steps: [],
  currStep: -1,
  checkPointStep: -1,
  isChangingBrushSize: false,
  isDrawing: false,
  canvas: null as unknown as HTMLCanvasElement,
  canvasCtx: null as unknown as CanvasRenderingContext2D,
  currCanvasImageElement: new Image(),
  isAutoFilling: false,
  drawingColor: '#FF7262',
} as ICanvasState

const MAX_STEP_COUNT = 20

export const useCanvasStore = defineStore('canvas', {
  state: (): ICanvasState => ({ ...defaultState }),
  getters: {
    isInCanvasFirstStep(): boolean {
      return this.currStep === 0 || this.currStep === this.checkPointStep
    },
    isInCanvasLastStep(): boolean {
      return this.currStep === this.steps.length - 1
    },
  },
  actions: {
    reset(keys?: Array<keyof ICanvasState>) {
      Object.assign(this, keys?.length ? pick(defaultState, keys) : defaultState) // if no keys provided, reset all
    },
    setCanvasMode(mode: PowerfulFillCanvasMode) {
      this.canvasMode = mode
    },
    setBrushSize(size: number) {
      this.brushSize = size
    },
    setResultCanvas(canvas: HTMLCanvasElement) {
      this.resultCanvas = canvas
    },
    setLoading(loading: boolean) {
      this.loading = loading
    },
    setIsProcessingStepsQueue(isProcessing: boolean) {
      this.isProcessingStepsQueue = isProcessing
    },
    setIsChangingBrushSize(isChanging: boolean) {
      this.isChangingBrushSize = isChanging
      if (!isChanging) {
        cmWVUtils.setState('brushSize', { brushSize: this.brushSize })
      }
    },
    setIsDrawing(isDrawing: boolean) {
      this.isDrawing = isDrawing
    },
    setCanvas(canvas: HTMLCanvasElement) {
      this.canvas = canvas
    },
    setCanvasCtx(ctx: CanvasRenderingContext2D) {
      this.canvasCtx = ctx
    },
    setCurrCanvasImageElement(img: HTMLImageElement) {
      this.currCanvasImageElement = img
    },
    setIsAutoFilling(isAutoFilling: boolean) {
      this.isAutoFilling = isAutoFilling
    },
    setDrawingColor(color: string) {
      this.drawingColor = color
    },
    pushStep(blob: Blob) {
      this.steps.length = this.currStep + 1
      if (this.steps.length === MAX_STEP_COUNT) {
        this.steps.shift()
      }
      this.steps.push(blob)
      this.currStep = this.steps.length - 1
    },
    pushToStepsQueue(promise: Promise<Blob | null>) {
      this.stepsQueue.push(promise)
    },
    setCurrStep(step: number) {
      this.currStep = step
    },
    setCheckPointStep(step?: number) {
      this.checkPointStep = step ?? this.currStep
    },
    clearStep() {
      this.steps = []
      this.currStep = -1
    },
  },
})
