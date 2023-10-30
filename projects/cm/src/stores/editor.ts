import type { EditorFeature, EditorState, EditorType, PowerfulFillCanvasMode } from '@/types/editor'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import { defineStore } from 'pinia'
import { useCanvasStore } from './canvas'
export interface IPage {
  width: number
  height: number
  backgroundColor: string
}

interface IEditorStore {
  imgAspectRatio: number
  editorState: EditorState
  currActiveFeature: EditorFeature
  editorType: EditorType
  canvasMode: PowerfulFillCanvasMode
  isAdjustingBottomPanel: boolean
  maskCanvas: HTMLCanvasElement
  maskDataUrl: string,
  isGenerating: boolean,
  generatedResult: string,
  showGenResult: boolean
}

export const useEditorStore = defineStore('editor', {
  state: (): IEditorStore => ({
    imgAspectRatio: 9 / 16,
    editorState: 'aspectRatio',
    currActiveFeature: 'none',
    editorType: 'powerful-fill',
    canvasMode: 'brush',
    isAdjustingBottomPanel: true,
    maskCanvas: document.createElement('canvas'),
    maskDataUrl: '',
    isGenerating: false,
    generatedResult: '',
    showGenResult: false
  }),
  getters: {
    pageSize(): { width: number; height: number } {
      return pageUtils.getPageSize(0)
    },
    pageAspectRatio(): number {
      return this.pageSize.width / this.pageSize.height
    },
    pageScaleRatio(): number{
      return pageUtils.scaleRatio / 100
    },
  },
  actions: {
    setPageSize(width: number, height: number) {
      useCanvasStore().setCanvasStoreState({
        canvasWidth: width,
        canvasHeight: height,
      })

      pageUtils.setPageSize(0, width, height)
    },

    createNewPage(width: number, height: number) {
      pageUtils.setPages([pageUtils.newPage({ width, height })])
    },
    setImgAspectRatio(ratio: number) {
      this.imgAspectRatio = ratio
    },
    setEditorState(state: EditorState) {
      this.editorState = state
    },
    setCurrActiveFeature(feature: EditorFeature) {
      this.currActiveFeature = feature
    },
    setEditorType(state: EditorState) {
      this.editorState = state
    },
    setCanvasMode(mode: PowerfulFillCanvasMode) {
      this.canvasMode = mode
    },
    setMaskCanvas(canvas: HTMLCanvasElement) {
      this.maskCanvas = canvas
    },
    setMaskCanvasDataUrl(dataUrl: string) {
      this.maskDataUrl = dataUrl
    },
    setIsGenerating(isGenerating: boolean) {
      this.isGenerating = isGenerating
    },
    setGeneratedResult(result: string) {
      this.generatedResult = result
    },
    setShowGenResult(show: boolean) {
      this.showGenResult = show
    }
  },
})
