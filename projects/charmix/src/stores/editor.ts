import { AppColors } from '@/types/color'
import type { EditorState, EditorType, PowerfulFillMode } from '@/types/editor'
import { defineStore } from 'pinia'
import { useCanvasStore } from './canvas'
export interface IPage {
  width: number
  height: number
  backgroundColor: string
}

export class Page implements IPage {
  width: number
  height: number
  backgroundColor: string
  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.backgroundColor = AppColors['primary-white']
  }
}

interface IEditorStore {
  imgAspectRatio: number
  editingPage: Page
  pageScaleRatio: number
  editorState: EditorState
  editorType: EditorType
  editorMode: PowerfulFillMode
  isAdjustingBottomPanel: boolean
  firstPaintArea: {
    width: number
    height: number
  }
}

export const useEditorStore = defineStore('editor', {
  state: (): IEditorStore => ({
    imgAspectRatio: 9 / 16,
    editingPage: new Page(900, 1600),
    pageScaleRatio: 0.1,
    editorState: 'aspectRatio',
    editorType: 'powerful-fill',
    editorMode: 'brush',
    isAdjustingBottomPanel: true,
    firstPaintArea: {
      width: 0,
      height: 0
    }
  }),
  getters: {
    pageSize(): { width: number; height: number } {
      return {
        width: this.editingPage.width,
        height: this.editingPage.height
      }
    }
  },
  actions: {
    setPageSize(width: number, height: number) {
      useCanvasStore().setCanvasStoreState({
        canvasWidth: width,
        canvasHeight: height
      })

      this.editingPage.width = width
      this.editingPage.height = height
    },

    createNewPage(width: number, height: number) {
      this.editingPage = new Page(width, height)
    },

    setPageScaleRatio(ratio: number) {
      this.pageScaleRatio = ratio
    },
    setImgAspectRatio(ratio: number) {
      this.imgAspectRatio = ratio
    },
    setEditorState(state: EditorState) {
      this.editorState = state
    },
    setEditorType(state: EditorState) {
      this.editorState = state
    },
    setEditorMode(mode: PowerfulFillMode) {
      this.editorMode = mode
    },
    setFirstPaintArea(width: number, height: number) {
      Object.assign(this.firstPaintArea, { width, height })
    }
  }
})
