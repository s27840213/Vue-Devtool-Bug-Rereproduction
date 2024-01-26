import useBiColorEditor from '@/composable/useBiColorEditor'
import useCanvasCm from '@/composable/useCanvasCm'
import useSteps from '@/composable/useSteps'
import router from '@/router'
import { useUserStore } from '@/stores/user'
import type {
  DescriptionPanel,
  EditorFeature,
  EditorStates,
  EditorType,
  GenImageOption,
  GenImageOptionToSave,
  HiddenMessageStates,
  MagicCombinedStates,
  PowerfulfillStates,
} from '@/types/editor'
import type { IStep } from '@nu/vivi-lib/interfaces/steps'
import store from '@nu/vivi-lib/store'
import constantData from '@nu/vivi-lib/utils/constantData'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import stepsUtils from '@nu/vivi-lib/utils/stepsUtils'
import { find } from 'lodash'
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
  width: number
  height: number
  // prompt: string
  video?: { src: string; removeWatermark: boolean }
  videoSize?: { width: number; height: number }
}

interface IEditorStore {
  imgAspectRatio: number
  editorStates: EditorStates
  currStateIndex: number
  prevState: string
  currActiveFeature: EditorFeature
  editorType: EditorType
  maskDataUrl: string
  maskParams: MaskParams
  isSendingGenImgReq: boolean
  generatedResults: Array<IGenResult>
  currDesignId: string
  selectedSubDesignId: string // SubDesign that user selected at (Editor step3) or MyDesign.
  editingSubDesignId: string // SubDesign that loaded in editor.
  stepsTypesArr: Array<'canvas' | 'editor' | 'both'>
  currStepTypeIndex: number
  stepTypeCheckPoint: number
  initImgSrc: string
  useTmpSteps: boolean
  // only when opening design from mydesign will set this value
  // used to save design to correct place if we edit the design (editorType will always be 'powerful-fill'
  // but if we edit a hidden-message design, we should save it to hidden-message folder)
  opendDesignType: EditorType | ''
  designName: '' | 'original' | 'result'
  // for saving to document and show more results
  currPrompt: string
  currGenOptions: GenImageOption[]
  editorTheme: null | string
  descriptionPanel: null | DescriptionPanel
  currDesignThumbIndex: number
  isRecordingBothSteps: boolean
}

export const useEditorStore = defineStore('editor', {
  state: (): IEditorStore => ({
    imgAspectRatio: 9 / 16,
    editorType: 'powerful-fill',
    editorStates: editorStatesMap['powerful-fill'],
    currStateIndex: 0,
    prevState: '',
    currActiveFeature: 'none',
    isSendingGenImgReq: false,
    generatedResults: [],
    currDesignId: '',
    selectedSubDesignId: '',
    editingSubDesignId: '',
    stepsTypesArr: [],
    currStepTypeIndex: -1,
    stepTypeCheckPoint: -1,
    initImgSrc: '',
    maskDataUrl: '',
    maskParams: {},
    useTmpSteps: false,
    currPrompt: '',
    currGenOptions: [],
    opendDesignType: '',
    designName: '',
    editorTheme: null,
    descriptionPanel: null,
    currDesignThumbIndex: 0,
    isRecordingBothSteps: false,
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
      return this.selectedSubDesignId
    },
    currGeneratedResult(): IGenResult | undefined {
      return find(this.generatedResults, ['id', this.selectedSubDesignId])
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
    currGenOptionsToSave(): GenImageOptionToSave {
      return Object.fromEntries(this.currGenOptions.map(({ key, value }) => [key, value]))
    },
    myDesignSavedType(): EditorType {
      return this.opendDesignType ? this.opendDesignType : this.editorType
    },
    myDesignSavedRoot(): string {
      return `mydesign-${this.myDesignSavedType}`
    },
  },
  actions: {
    setPageSize(width: number, height: number) {
      const { updateCanvasSize } = useCanvasCm()
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
        designType?: EditorType | ''
        generatedResults?: Array<IGenResult>
        designWidth?: number
        designHeight?: number
        designName?: '' | 'result' | 'original'
        selectedSubDesignId?: string
      },
    ) {
      const {
        stateTarget,
        designId,
        generatedResults,
        designWidth = 900,
        designHeight = 1600,
        designName = '',
        designType,
        selectedSubDesignId = '',
      } = options || {}

      this.currStateIndex = 0
      this.setEditorType(type)
      this.designName = designName
      this.selectedSubDesignId = selectedSubDesignId
      this.editingSubDesignId = selectedSubDesignId
      this.currDesignId = designId || generalUtils.generateAssetId()
      this.setOpenedDesignType(designType ?? '')

      this.editorStates = editorStatesMap[this.editorType]
      if (stateTarget && this.editorStates.findIndex((item) => item === stateTarget) !== -1) {
        this.changeToSpecificEditorState(stateTarget)
      }
      if (generatedResults) {
        this.generatedResults = generatedResults
      }

      useSteps().reset()

      router.push({ name: 'Editor', query: { type, width: designWidth, height: designHeight } })
    },
    changeEditorState(dir: 'next' | 'prev') {
      const statesLen = this.editorStates.length
      this.prevState = this.editorStates[this.currStateIndex]
      const toNext = dir === 'next'
      if (toNext && this.currStateIndex < statesLen - 1) {
        this.currStateIndex++
      } else if (!toNext && this.currStateIndex > 0) {
        this.currStateIndex--
      }
    },
    changeToSpecificEditorState(state: string, type?: EditorType) {
      this.prevState = this.editorStates[this.currStateIndex]
      this.editorStates = editorStatesMap[type ?? this.editorType]
      this.currStateIndex = this.editorStates.findIndex((item) => item === state)
    },
    setCurrActiveFeature(feature: EditorFeature) {
      this.currActiveFeature = feature
    },
    setEditorType(type: EditorType) {
      this.editorType = type

      // update isHm for asset panels
      store.dispatch('assetPanel/setIsHiddenMessage', this.editorType === 'hidden-message')
    },
    setIsSendingGenImgReq(isSendingGenImgReq: boolean) {
      this.isSendingGenImgReq = isSendingGenImgReq
    },
    async unshiftGenResults(url: string, id: string /*, prompt: string */) {
      const { width, height } = this.pageSize
      this.generatedResults.unshift({
        url,
        id,
        width,
        height,
        // prompt,
      })
    },
    updateGenResult(
      id: string,
      data: {
        url?: string
        video?: null | { src: string; removeWatermark: boolean }
        videoSize?: null | { width: number; height: number }
        updateIndex?: boolean
        saveToDocument?: boolean
        saveMask?: boolean
      },
    ) {
      const index = this.generatedResults.findIndex((item) => item.id === id)
      if (index === -1) return
      const { url, video, videoSize, updateIndex } = data
      if (url) {
        this.generatedResults[index].url = url
      }

      if (video) {
        if (this.generatedResults[index].video?.src) {
          console.warn('updateGenResult 1', this.generatedResults[index].video?.src, video)
          URL.revokeObjectURL(this.generatedResults[index].video?.src || '')
        }
        this.generatedResults[index].video = { ...video }
      } else if (video === null) {
        if (this.generatedResults[index].video?.src) {
          console.warn('updateGenResult 2', this.generatedResults[index].video?.src)
          URL.revokeObjectURL(this.generatedResults[index].video?.src || '')
        }
        this.generatedResults[index].video = undefined
      }

      if (videoSize) {
        this.generatedResults[index].videoSize = videoSize
      } else if (videoSize === null) {
        this.generatedResults[index].videoSize = undefined
      }

      if (updateIndex && this.selectedSubDesignId === '') {
        this.selectedSubDesignId = id
      }
    },
    removeGenResult(id: string) {
      const index = this.generatedResults.findIndex((item) => item.id === id)
      if (index === -1) return
      this.generatedResults.splice(index, 1)
      if (this.selectedSubDesignId === id) {
        this.selectedSubDesignId = ''
      }
    },
    clearGeneratedResults() {
      this.generatedResults = []
    },
    setSelectedSubDesignId(id: string) {
      this.selectedSubDesignId = id
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
    pushStepType(type: 'canvas' | 'editor' | 'both') {
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
    setCurrGenOptions(options: GenImageOption[]) {
      this.currGenOptions = options
    },
    updateCurrGenOption(option: Pick<GenImageOption, 'key' | 'value'>) {
      const currOption = this.currGenOptions.find((o) => o.key === option.key)
      if (currOption) currOption.value = option.value
    },
    restoreGenOptions(options: GenImageOptionToSave, type: EditorType) {
      const defaultOptions = constantData.getGenImageOptions(type) as GenImageOption[] | undefined
      if (!defaultOptions) return
      this.currGenOptions = defaultOptions.map((option) => {
        const value = options?.[option.key]
        if (value) option.value = value
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
    setOpenedDesignType(type: EditorType | '') {
      this.opendDesignType = type
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
    setIsRecordingBothSteps(isRecordingBothSteps: boolean) {
      this.isRecordingBothSteps = isRecordingBothSteps
    },
  },
})
