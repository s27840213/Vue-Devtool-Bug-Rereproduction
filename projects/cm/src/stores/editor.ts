import type { EditorFeature, EditorType, PowerfulfillStates } from '@/types/editor'
import type { IStep } from '@nu/vivi-lib/interfaces/steps'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import stepsUtils from '@nu/vivi-lib/utils/stepsUtils'
import { defineStore } from 'pinia'
import { useCanvasStore } from './canvas'
export interface IPage {
  width: number
  height: number
  backgroundColor: string
}

interface IEditorStore {
  imgAspectRatio: number
  editorState: PowerfulfillStates
  currActiveFeature: EditorFeature
  editorType: EditorType
  maskDataUrl: string
  isGenerating: boolean
  generatedResult: string
  showGenResult: boolean
  stepsTypesArr: Array<'canvas' | 'editor'>
  currStepTypeIndex: number
}

export const useEditorStore = defineStore('editor', {
  state: (): IEditorStore => ({
    imgAspectRatio: 9 / 16,
    editorState: 'aspectRatio',
    currActiveFeature: 'none',
    editorType: 'powerful-fill',
    maskDataUrl: '',
    isGenerating: false,
    generatedResult: '',
    showGenResult: false,
    stepsTypesArr: [],
    currStepTypeIndex: -1,
  }),
  getters: {
    pageSize(): { width: number; height: number } {
      return pageUtils.getPageSize(0)
    },
    pageAspectRatio(): number {
      return this.pageSize.width / this.pageSize.height
    },
    pageScaleRatio(): number {
      return pageUtils.scaleRatio / 100
    },
    showBrushOptions(): boolean {
      return this.currActiveFeature === 'brush'
    },
    showSelectionOptions(): boolean {
      return this.currActiveFeature === 'selection'
    },
    isEditing(): boolean {
      return this.editorState === 'editing'
    },
    editorSteps(): Array<IStep> {
      return stepsUtils.steps
    },
    editorCurrStep(): number {
      return stepsUtils.currStep
    },
    isInEditorFirstStep(): boolean {
      return stepsUtils.isInFirstStep
    },
    isInEditorLastStep(): boolean {
      return stepsUtils.isInLastStep
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
      pageUtils.setPages([
        pageUtils.newPage({ width, height }),
        pageUtils.newPage({ width, height }),
      ])
    },
    setImgAspectRatio(ratio: number) {
      this.imgAspectRatio = ratio
    },
    setEditorState(state: PowerfulfillStates) {
      this.editorState = state
    },
    setCurrActiveFeature(feature: EditorFeature) {
      this.currActiveFeature = feature
    },
    setEditorType(state: PowerfulfillStates) {
      this.editorState = state
    },
    setIsGenerating(isGenerating: boolean) {
      this.isGenerating = isGenerating
    },
    setGeneratedResult(result: string) {
      this.generatedResult = result
    },
    setShowGenResult(show: boolean) {
      this.showGenResult = show
    },
    undo() {
      stepsUtils.undo()
    },
    redo() {
      stepsUtils.redo()
    },
    delayedRecord() {
      stepsUtils.delayedRecord()
    },
    stepsReset() {
      stepsUtils.reset()
    },
    pushStepType(type: 'canvas' | 'editor') {
      this.stepsTypesArr.push(type)
    },
    setCurrStepTypeIndex(index: number) {
      console.log(index, this.stepsTypesArr.length)
      if (index < 0 || index >= this.stepsTypesArr.length) return
      this.currStepTypeIndex = index
    },
  },
})
