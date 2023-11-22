import { PowerfulFillCanvasMode } from '@/types/editor'
import { defineStore } from 'pinia'
export interface ICanvasState {
  isUsingCanvas: boolean
  canvasMode: PowerfulFillCanvasMode
  brushSize: number
  resultCanvas: HTMLCanvasElement
  loading: boolean
  isProcessingStepsQueue: boolean
  stepsQueue: Array<Promise<Blob | null>>
  steps: Array<Blob>
  currStep: number
  isProcessingCanvas: boolean
  isChangingBrushSize: boolean
  isDrawing: boolean
  maskCanvas: HTMLCanvasElement | null
  canvas: HTMLCanvasElement | null
  canvasCtx: CanvasRenderingContext2D | null
  currCanvasImageElement: HTMLImageElement
  isAutoFilling: boolean
}

const MAX_STEP_COUNT = 20

export const useCanvasStore = defineStore('canvas', {
  state: (): ICanvasState => ({
    isUsingCanvas: false,
    canvasMode: 'brush',
    brushSize: 16,
    resultCanvas: null as unknown as HTMLCanvasElement,
    loading: false,
    isProcessingStepsQueue: false,
    stepsQueue: [],
    steps: [],
    currStep: -1,
    isProcessingCanvas: false,
    isChangingBrushSize: false,
    isDrawing: false,
    maskCanvas: null as unknown as HTMLCanvasElement,
    canvas: null as unknown as HTMLCanvasElement,
    canvasCtx: null as unknown as CanvasRenderingContext2D,
    currCanvasImageElement: new Image(),
    isAutoFilling: false,
  }),
  getters: {
    isInCanvasFirstStep(): boolean {
      return this.currStep === 0
    },
    isInCanvasLastStep(): boolean {
      return this.currStep === this.steps.length - 1
    },
  },
  actions: {
    setCanvasStoreState(props: Partial<ICanvasState>) {
      const newState = props
      const keys = Object.keys(newState) as Array<keyof ICanvasState>
      keys.forEach((key) => {
        if (key in this) {
          ;(this[key] as unknown) = newState[key]
        }
      })
    },
    pushStep(blob: Blob) {
      this.steps.length = this.currStep + 1
      if (this.steps.length === MAX_STEP_COUNT) {
        this.steps.shift()
      }
      this.steps.push(blob)
      this.currStep = this.steps.length - 1
    },
    setCurrStep(step: number) {
      this.currStep = step
    },
    clearStep() {
      this.steps = []
      this.currStep = -1
    },
  },
})
