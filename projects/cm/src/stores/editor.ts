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
  firstPaintArea: {
    width: number
    height: number
  }
  maskCanvas: HTMLCanvasElement
  maskDataUrl: string
}

export const useEditorStore = defineStore('editor', {
  state: (): IEditorStore => ({
    imgAspectRatio: 9 / 16,
    editorState: 'aspectRatio',
    currActiveFeature: 'none',
    editorType: 'powerful-fill',
    canvasMode: 'brush',
    isAdjustingBottomPanel: true,
    firstPaintArea: {
      width: 0,
      height: 0,
    },
    maskCanvas: document.createElement('canvas'),
    maskDataUrl: '',
  }),
  getters: {
    pageSize(): { width: number; height: number } {
      return pageUtils.getPageSize(0)
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
      pageUtils.setPages([pageUtils.newPage({ width, height})])
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
    setFirstPaintArea(width: number, height: number) {
      Object.assign(this.firstPaintArea, { width, height })
      console.log(this.firstPaintArea)
    },
    setMaskCanvas(canvas: HTMLCanvasElement) {
      this.maskCanvas = canvas
    },
    setMaskCanvasDataUrl(dataUrl: string) {
      this.maskDataUrl = dataUrl
    },
  },
})
