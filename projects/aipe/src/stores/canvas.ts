import { defineStore } from 'pinia'
export interface ICanvasState {
  inCanvasMode: boolean
  brushSize: number
  resultCanvas: HTMLCanvasElement
  loading: boolean
  steps: Array<string>
  currStep: number
  isProcessing: boolean
  isChangingBrushSize: boolean
  canvasWidth: number
  canvasHeight: number
  isDrawing: boolean
  canvasCtx: CanvasRenderingContext2D | null
}

export const useCanvasStore = defineStore('canvas', {
  state: (): ICanvasState => ({
    inCanvasMode: false,
    brushSize: 16,
    resultCanvas: null as unknown as HTMLCanvasElement,
    loading: false,
    steps: [],
    currStep: -1,
    isProcessing: false,
    isChangingBrushSize: false,
    canvasWidth: 900,
    canvasHeight: 1600,
    isDrawing: false,
    canvasCtx: null as unknown as CanvasRenderingContext2D
  }),
  getters: {
    canvasSize(): { width: number; height: number } {
      return {
        width: this.canvasWidth,
        height: this.canvasHeight
      }
    }
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
    }
  }
})
