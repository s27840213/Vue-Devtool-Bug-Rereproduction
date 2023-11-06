import useSteps from '@/composable/useSteps'
import type { EditorFeature, EditorType, PowerfulfillStates } from '@/types/editor'
import type { IStep } from '@nu/vivi-lib/interfaces/steps'
import assetUtils from '@nu/vivi-lib/utils/assetUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import stepsUtils from '@nu/vivi-lib/utils/stepsUtils'
import { defineStore } from 'pinia'
import { useCanvasStore } from './canvas'

export interface IGenResult {
  id: string
  url: string
}

interface IEditorStore {
  imgAspectRatio: number
  editorState: PowerfulfillStates
  currActiveFeature: EditorFeature
  editorType: EditorType
  maskDataUrl: string
  isGenerating: boolean
  generatedResults: Array<IGenResult>
  showGenResult: boolean
  currGenResultIndex: number
  stepsTypesArr: Array<'canvas' | 'editor'>
  currStepTypeIndex: number
  initImgSrc: string
}

export const useEditorStore = defineStore('editor', {
  state: (): IEditorStore => ({
    imgAspectRatio: 9 / 16,
    editorState: 'aspectRatio',
    currActiveFeature: 'none',
    editorType: 'powerful-fill',
    maskDataUrl: '',
    isGenerating: false,
    generatedResults: [],
    showGenResult: false,
    currGenResultIndex: 0,
    stepsTypesArr: [],
    currStepTypeIndex: -1,
    initImgSrc: '',
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
    unshiftGenResults(url: string, id: string) {
      this.generatedResults.unshift({
        url,
        id,
      })
    },
    updateGenResult(url: string, id: string) {
      const index = this.generatedResults.findIndex((item) => item.id === id)
      Object.assign(this.generatedResults[index], { url })
    },
    clearGeneratedResults() {
      this.generatedResults = []
    },
    setShowGenResult(show: boolean) {
      this.showGenResult = show
    },
    setGenResultIndex(index: number) {
      this.currGenResultIndex = index
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
      if (index < 0 || index >= this.stepsTypesArr.length) return
      this.currStepTypeIndex = index
    },
    resetStepsTypesArr() {
      this.stepsTypesArr = []
      this.currGenResultIndex = -1
    },
    setInitImgSrc(src: string) {
      this.initImgSrc = src
    },
    keepEditingInit() {
      this.setShowGenResult(false)
      this.createNewPage(this.pageSize.width, this.pageSize.height)

      assetUtils.addImage(
        this.currGenResultIndex === -1
          ? this.initImgSrc
          : this.generatedResults[this.currGenResultIndex].url,
        this.pageAspectRatio,
        {
          fit: 1,
        },
      )
      groupUtils.deselect()

      useSteps().reset()
    },
  },
})
