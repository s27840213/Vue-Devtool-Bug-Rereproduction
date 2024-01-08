import useBiColorEditor from '@/composable/useBiColorEditor'
import useCanvasUtils from '@/composable/useCanvasUtilsCm'
import router from '@/router'
import { useUserStore } from '@/stores/user'
import type {
  DescriptionPanel,
  EditorFeature,
  EditorStates,
  EditorType,
  GenImageOptions,
  HiddenMessageStates,
  MagicCombinedStates,
  PowerfulfillStates,
} from '@/types/editor'
import type { IStep } from '@nu/vivi-lib/interfaces/steps'
import constantData from '@nu/vivi-lib/utils/constantData'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import stepsUtils from '@nu/vivi-lib/utils/stepsUtils'
import { defineStore } from 'pinia'

const editorStatesMap = {
  'powerful-fill': ['aspectRatio', 'editing', 'genResult', 'saving'] as PowerfulfillStates[],
  'hidden-message': ['aspectRatio', 'editing', 'genResult', 'saving'] as HiddenMessageStates[],
  'magic-combined': ['aspectRatio', 'editing', 'genResult', 'saving'] as MagicCombinedStates[],
} as { [key in EditorType]: EditorStates }

export interface MaskParams {
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface IGenResult {
  id: string
  url: string
  prompt: string
  video?: { src: string, removeWatermark: boolean }
}

interface IEditorStore {
  imgAspectRatio: number
  editorStates: EditorStates
  currStateIndex: number
  currActiveFeature: EditorFeature
  editorType: EditorType
  maskDataUrl: string
  maskParams: MaskParams
  isSendingGenImgReq: boolean
  generatedResults: Array<IGenResult>
  currGenResultIndex: number
  stepsTypesArr: Array<'canvas' | 'editor'>
  currStepTypeIndex: number
  stepTypeCheckPoint: number
  initImgSrc: string
  useTmpSteps: boolean
  currDesignId: string
  designName: '' | 'original' | 'result'
  // for saving to document and show more results
  currPrompt: string
  currGenOptions: GenImageOptions
  editorTheme: null | string
  descriptionPanel: null | DescriptionPanel
  currDesignThumbIndex: number
}

export const useEditorStore = defineStore('editor', {
  state: (): IEditorStore => ({
    imgAspectRatio: 9 / 16,
    editorType: 'powerful-fill',
    editorStates: editorStatesMap['powerful-fill'],
    currStateIndex: 0,
    currActiveFeature: 'none',
    isSendingGenImgReq: false,
    generatedResults: [],
    currGenResultIndex: 0,
    stepsTypesArr: [],
    currStepTypeIndex: -1,
    stepTypeCheckPoint: -1,
    initImgSrc: '',
    maskDataUrl: '',
    maskParams: {},
    useTmpSteps: false,
    currPrompt: '',
    currGenOptions: [],
    currDesignId: '',
    designName: '',
    editorTheme: null,
    descriptionPanel: null,
    currDesignThumbIndex: 0,
    // if the user send empty prompt, show warning at fisrt time
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
    contentScaleRatio(): number {
      return pageUtils.contentScaleRatio
    },
    showBrushOptions(): boolean {
      return this.currActiveFeature === 'cm_brush'
    },
    showSelectionOptions(): boolean {
      return this.currActiveFeature === 'selection'
    },
    inAspectRatioState(): boolean {
      return this.editorStates[this.currStateIndex] === 'aspectRatio'
    },
    inEditingState(): boolean {
      return this.editorStates[this.currStateIndex] === 'editing'
    },
    inGenResultState(): boolean {
      return this.editorStates[this.currStateIndex] === 'genResult'
    },
    inSavingState(): boolean {
      return this.editorStates[this.currStateIndex] === 'saving'
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
    currSubDesignId(): string {
      return this.currGeneratedResult.id
    },
    currGeneratedResult(): IGenResult {
      return this.generatedResults[this.currGenResultIndex]
    },
    generatedResultsNum(): number {
      return this.generatedResults.length
    },
    isGenerating(): boolean {
      return this.generatedResults.some((item) => item.url === '')
    },
    hasGeneratedResults(): boolean {
      return (
        this.generatedResults.length > 0 && this.generatedResults.some((item) => item.url !== '')
      )
    },
    showDescriptionPanel(): boolean {
      return this.descriptionPanel !== null
    },
    currGenOptionsToSave(): { [key: string]: any } {
      return Object.fromEntries(this.currGenOptions.map(({ key, value }) => [key, value]))
    },
  },
  actions: {
    setPageSize(width: number, height: number) {
      const { updateCanvasSize } = useCanvasUtils()
      pageUtils.setPageSize(0, width, height)
      updateCanvasSize()
    },
    createNewPage(width: number, height: number) {
      pageUtils.setPages([pageUtils.newPage({ width, height })])
    },
    setImgAspectRatio(ratio: number) {
      this.imgAspectRatio = ratio
    },
    startEditing(
      type: EditorType,
      options?: {
        stateTarget?: string
        designId?: string
        generatedResults?: Array<IGenResult>
        designWidth?: number
        designHeight?: number
        designName?: '' | 'result' | 'original'
      },
    ) {
      const {
        stateTarget,
        designId,
        generatedResults,
        designWidth = 900,
        designHeight = 1600,
        designName = '',
      } = options || {}

      this.currStateIndex = 0
      this.editorType = type
      this.designName = designName
      this.currDesignId = designId || generalUtils.generateAssetId()

      this.editorStates = editorStatesMap[this.editorType]
      if (stateTarget && this.editorStates.findIndex((item) => item === stateTarget) !== -1) {
        this.changeToSpecificEditorState(stateTarget)
      }
      if (generatedResults) {
        this.generatedResults = generatedResults
      }

      router.push({ name: 'Editor', query: { type, width: designWidth, height: designHeight } })
    },
    changeEditorState(dir: 'next' | 'prev') {
      const statesLen = this.editorStates.length
      const toNext = dir === 'next'
      if (toNext && this.currStateIndex < statesLen - 1) {
        this.currStateIndex++
      } else if (!toNext && this.currStateIndex > 0) {
        this.currStateIndex--
      }
    },
    changeToSpecificEditorState(state: string, type?: EditorType) {
      this.editorStates = editorStatesMap[type ?? this.editorType]
      this.currStateIndex = this.editorStates.findIndex((item) => item === state)
    },
    setCurrActiveFeature(feature: EditorFeature) {
      this.currActiveFeature = feature
    },
    setEditorType(type: EditorType) {
      this.editorType = type
    },
    setIsSendingGenImgReq(isSendingGenImgReq: boolean) {
      this.isSendingGenImgReq = isSendingGenImgReq
    },
    unshiftGenResults(url: string, id: string, prompt: string) {
      if (this.generatedResults.length > 0) {
        this.currGenResultIndex += 1
      }
      this.generatedResults.unshift({
        url,
        id,
        prompt,
      })
    },
    updateGenResult(
      id: string,
      data: {
        url?: string
        video?: { src: string, removeWatermark: boolean }
        updateIndex?: boolean
        saveToDocument?: boolean
        saveMask?: boolean
      },
    ) {
      const index = this.generatedResults.findIndex((item) => item.id === id)
      if (index === -1) return
      const { url, video, updateIndex } = data
      if (url) {
        this.generatedResults[index].url = url
      }
      if (video) {
        this.generatedResults[index].video = { ...video }
      }
      if (updateIndex && this.currGenResultIndex === -1) {
        this.currGenResultIndex = index
      }
    },
    removeGenResult(id: string) {
      const index = this.generatedResults.findIndex((item) => item.id === id)
      if (index === -1) return
      this.generatedResults.splice(index, 1)
      if (
        this.currGenResultIndex === index &&
        this.currGenResultIndex >= this.generatedResults.length
      ) {
        this.currGenResultIndex -= 1
        if (this.currGenResultIndex < 0) {
          this.currGenResultIndex = 0
        }
      }
    },
    clearGeneratedResults() {
      this.generatedResults = []
    },
    setCurrGenResultIndex(index: number) {
      this.currGenResultIndex = index
    },
    async undo() {
      await stepsUtils.undo()

      const { currEditorTheme, applyEditorTheme } = useBiColorEditor()
      if (currEditorTheme.value) applyEditorTheme(currEditorTheme.value)
    },
    async redo() {
      await stepsUtils.redo()

      const { currEditorTheme, applyEditorTheme } = useBiColorEditor()
      if (currEditorTheme.value) applyEditorTheme(currEditorTheme.value)
    },
    stepsReset() {
      stepsUtils.reset()
    },
    pageReset(width = 900, height = 1600) {
      this.createNewPage(width, height)
    },
    pushStepType(type: 'canvas' | 'editor') {
      this.stepsTypesArr.push(type)
    },
    setCurrStepTypeIndex(index: number) {
      if (index < 0 || index >= this.stepsTypesArr.length) return
      this.currStepTypeIndex = index
    },
    setStepTypeCheckPoint(index?: number) {
      this.stepTypeCheckPoint = index ?? this.currStepTypeIndex
    },
    resetStepsTypesArr() {
      this.stepsTypesArr = []
      this.currStepTypeIndex = -1
    },
    setInitImgSrc(src: string) {
      this.initImgSrc = src
    },
    setMaskDataUrl(url: string) {
      this.maskDataUrl = url
      this.maskParams = {}
    },
    updateMaskParams(params: Partial<MaskParams>) {
      this.maskParams = { ...this.maskParams, ...params }
    },
    setCurrPrompt(prompt: string) {
      this.currPrompt = prompt
    },
    setCurrGenOptions(options: GenImageOptions) {
      this.currGenOptions = options
    },
    restoreGenOptions(options: { [key: string]: any }) {
      const defaultOptions = constantData.getGenImageOptions(this.editorType) as GenImageOptions | undefined
      if (!defaultOptions) return
      this.currGenOptions = defaultOptions.map((option) => {
        Object.assign(option, options[option.key])
        return option
      })
    },
    async keepEditingInit() {
      // Do the same thing with user.editSubDesignResult.
      const { initWithSubDesignImage, initWithSubDesignConfig, getSubDesignConfig } = useUserStore()
      const { editorType: type, currDesignId: id, currSubDesignId: subId } = this

      // Try to open result.json.
      const resultJson = await getSubDesignConfig({ type, id }, subId, 'result')
      if (resultJson && resultJson.flag === '0') {
        initWithSubDesignConfig(resultJson.content)
        return
      }

      // Cannot find result.json, use result img to create new design.
      const originalJson = await getSubDesignConfig({ type, id }, subId)
      if (originalJson && originalJson.flag === '0') {
        initWithSubDesignImage(originalJson.content)
      }
    },
    setCurrDesignId(id: string) {
      this.currDesignId = id
    },
    setEditorTheme(theme: string | null) {
      this.editorTheme = theme
    },
    setDescriptionPanel(panel: DescriptionPanel | null) {
      this.descriptionPanel = panel
    },
    setCurrDesignThumbIndex(index: number) {
      this.currDesignThumbIndex = index
    },
  },
})
