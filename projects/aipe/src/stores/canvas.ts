import { defineStore } from 'pinia'
export interface ICanvasState {
  inCanvasMode: boolean
  brushSize: number
  canvas: HTMLCanvasElement
  loading: boolean
  steps: Array<string>
  currStep: number
  isProcessing: boolean
  isChangingBrushSize: boolean
}

export const useCanvasStore = defineStore('canvas', {
  state: (): ICanvasState => ({
    inCanvasMode: false,
    brushSize: 16,
    canvas: null as unknown as HTMLCanvasElement,
    loading: false,
    steps: [],
    currStep: -1,
    isProcessing: false,
    isChangingBrushSize: false
  }),
  getters: {},
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
