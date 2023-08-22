import { AppColors } from '@/types/color'
import type { EditorState, EditorType, PowerfulFillMode } from '@/types/editor'
import { defineStore } from 'pinia'
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
  initAspectRatio: number
  editingPage: Page
  pageScaleRatio: number
  editorState: EditorState
  editorType: EditorType
  editorMode: PowerfulFillMode
}

export const useEditorStore = defineStore('editor', {
  state: (): IEditorStore => ({
    initAspectRatio: 9 / 16,
    editingPage: new Page(900, 1600),
    pageScaleRatio: 1,
    editorState: 'aspectRatio',
    editorType: 'powerful-fill',
    editorMode: 'selection'
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
      this.editingPage.width = width
      this.editingPage.height = height
    },

    createNewPage(width: number, height: number) {
      this.editingPage = new Page(width, height)
    },

    setPageScaleRatio(ratio: number) {
      this.pageScaleRatio = ratio
    },
    setInitAspectRatio(ratio: number) {
      this.initAspectRatio = ratio
    },
    setEditorState(state: EditorState) {
      this.editorState = state
    },
    setEditorType(state: EditorState) {
      this.editorState = state
    },
    setEditorMode(mode: PowerfulFillMode) {
      this.editorMode = mode
    }
  }
})
