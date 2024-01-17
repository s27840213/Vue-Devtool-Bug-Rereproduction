import { useEditorStore } from '@/stores/editor'
import store from '@nu/vivi-lib/store'
import bgRemoveUtils from '@nu/vivi-lib/utils/bgRemoveUtils'
import stepsUtils from '@nu/vivi-lib/utils/stepsUtils'
import { storeToRefs } from 'pinia'
import useCanvasUtils from './useCanvasUtilsCm'

const useSteps = (enableWatch = false) => {
  const editorStore = useEditorStore()
  const {
    undo: editorUndo,
    redo: editorRedo,
    setCurrStepTypeIndex,
    pushStepType,
    stepsReset,
    resetStepsTypesArr,
    setStepTypeCheckPoint,
    setIsRecordingBothSteps,
  } = editorStore
  const {
    editorCurrStep,
    editorSteps,
    stepsTypesArr,
    currStepTypeIndex,
    isInEditorFirstStep,
    isInEditorLastStep,
    stepTypeCheckPoint,
    isRecordingBothSteps,
  } = storeToRefs(editorStore)

  const {
    undo: canvasUndo,
    redo: canvasRedo,
    reset: canvasReset,
    record: canvasRecord,
    isInCanvasFirstStep,
    isInCanvasLastStep,
    steps: canvasSteps,
    currStep: canvasCurrStep,
    isProcessingStepsQueue,
    setCheckPointStep: setCanvasCheckPointStep,
    goToCheckpoint: goToCanvasCheckpoint,
  } = useCanvasUtils()

  // #region recording both related
  const recordBoth = () => {
    setIsRecordingBothSteps(true)
    stepsTypesArr.value.length = currStepTypeIndex.value + 1
    pushStepType('both')
    setCurrStepTypeIndex(currStepTypeIndex.value + 1)
    editorSteps.value.length = editorCurrStep.value + 1
    canvasSteps.value.length = canvasCurrStep.value + 1

    canvasRecord()
    stepsUtils.record()
  }
  // #endregion

  // #region bg remove related
  const inBgRemoveMode = computed(() => store.getters['bgRemove/getInBgRemoveMode'])
  const inBgRemoveFirstStep = computed(() => store.getters['bgRemove/inFirstStep'])
  const inBgRemoveLastStep = computed(() => store.getters['bgRemove/inLastStep'])
  // #endregion

  const editorStepsNum = computed(() => editorSteps.value.length)
  const canvasStepsNum = computed(() => canvasSteps.value.length)

  const isInFirstStep = computed(() => {
    return inBgRemoveMode.value
      ? inBgRemoveFirstStep.value
      : isInEditorFirstStep.value && isInCanvasFirstStep.value
  })
  const isInLastStep = computed(() => {
    return inBgRemoveMode.value
      ? inBgRemoveLastStep.value
      : isInEditorLastStep.value && isInCanvasLastStep.value
  })

  const undo = () => {
    if (isInFirstStep.value || isProcessingStepsQueue.value) return
    if (inBgRemoveMode.value) {
      bgRemoveUtils.undo()
      return
    }
    if (stepsTypesArr.value[currStepTypeIndex.value] === 'both') {
      editorUndo()
      canvasUndo()
    } else if (stepsTypesArr.value[currStepTypeIndex.value] === 'editor') {
      if (isInEditorFirstStep.value) {
        setCurrStepTypeIndex(currStepTypeIndex.value - 1)
        undo()
        return
      }
      editorUndo()
    } else if (stepsTypesArr.value[currStepTypeIndex.value] === 'canvas') {
      if (isInCanvasFirstStep.value) {
        setCurrStepTypeIndex(currStepTypeIndex.value - 1)
        undo()
        return
      }
      canvasUndo()
    }
    setCurrStepTypeIndex(currStepTypeIndex.value - 1)
  }

  const redo = () => {
    if (isInLastStep.value || isProcessingStepsQueue.value) return
    if (inBgRemoveMode.value) {
      bgRemoveUtils.redo()
      return
    }
    if (stepsTypesArr.value[currStepTypeIndex.value] === 'both') {
      editorRedo()
      canvasRedo()
    } else if (stepsTypesArr.value[currStepTypeIndex.value] === 'editor') {
      if (isInEditorLastStep.value) {
        setCurrStepTypeIndex(currStepTypeIndex.value + 1)
        redo()
        return
      }
      editorRedo()
    } else if (stepsTypesArr.value[currStepTypeIndex.value] === 'canvas') {
      if (isInCanvasLastStep.value) {
        setCurrStepTypeIndex(currStepTypeIndex.value + 1)
        redo()
        return
      }
      canvasRedo()
    }
    setCurrStepTypeIndex(currStepTypeIndex.value + 1)
  }

  const setCheckpoint = (reset?: boolean) => {
    if (reset) {
      stepsUtils.setCheckpoint(-1)
      setCanvasCheckPointStep(-1)
      setStepTypeCheckPoint(-1)
      return
    }
    stepsUtils.setCheckpoint()
    setCanvasCheckPointStep()
    setStepTypeCheckPoint()
  }

  const goToCheckpoint = () => {
    stepsUtils.goToCheckpoint()
    goToCanvasCheckpoint()

    setCurrStepTypeIndex(stepTypeCheckPoint.value)
    stepsTypesArr.value.length = stepTypeCheckPoint.value + 1
  }

  const hasUnsavedChanges = computed(() => {
    return stepsUtils.steps.length !== 1 || canvasSteps.value.length !== 1
  })

  /**
   * @TODO clear the steps between checkpoint and result [low priority]
   */
  // const clearStepsBetweenCheckpointAndResult = () => {
  //   stepsUtils.steps.splice(stepTypeCheckPoint.value + 1, stepsUtils.steps.length - stepTypeCheckPoint.value - 1)
  //   canvasSteps.value.splice(stepTypeCheckPoint.value + 1, canvasSteps.value.length - stepTypeCheckPoint.value - 1)
  //   stepsTypesArr.value.splice(stepTypeCheckPoint.value + 1, stepsTypesArr.value.length - stepTypeCheckPoint.value - 1)
  // }

  const reset = () => {
    stepsReset()
    canvasReset()
    resetStepsTypesArr()
  }

  if (enableWatch) {
    watch(editorStepsNum, (newVal, oldVal) => {
      if (isRecordingBothSteps.value) {
        return
      }
      // skip the init state
      if (oldVal === 0 && newVal === 1) return
      stepsTypesArr.value.length = currStepTypeIndex.value + 1
      pushStepType('editor')
      setCurrStepTypeIndex(currStepTypeIndex.value + 1)
      canvasSteps.value.length = canvasCurrStep.value + 1
    })

    watch(canvasStepsNum, (newVal, oldVal) => {
      if (isRecordingBothSteps.value) {
        // if we recorded both steps, the canvas record will be triggered later than editor record bcz it's asynchronous
        setIsRecordingBothSteps(false)
        return
      }
      // skip the init state
      if (oldVal === 0 && newVal === 1) return
      stepsTypesArr.value.length = currStepTypeIndex.value + 1
      pushStepType('canvas')
      setCurrStepTypeIndex(currStepTypeIndex.value + 1)
      editorSteps.value.length = editorCurrStep.value + 1
    })
  }

  return {
    undo,
    redo,
    reset,
    isInFirstStep,
    isInLastStep,
    setCheckpoint,
    goToCheckpoint,
    canvasRecord,
    recordBoth,
    hasUnsavedChanges,
  }
}

export default useSteps
