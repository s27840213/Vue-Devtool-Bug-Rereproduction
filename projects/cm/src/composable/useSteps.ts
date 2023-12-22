import { useEditorStore } from '@/stores/editor'
import stepsUtils from '@nu/vivi-lib/utils/stepsUtils'
import { storeToRefs } from 'pinia'
import useCanvasUtils from './useCanvasUtilsCm'

const useSteps = () => {
  const editorStore = useEditorStore()
  const {
    undo: editorUndo,
    redo: editorRedo,
    setCurrStepTypeIndex,
    pushStepType,
    stepsReset,
    resetStepsTypesArr,
    setStepTypeCheckPoint,
  } = editorStore
  const {
    editorCurrStep,
    editorSteps,
    stepsTypesArr,
    currStepTypeIndex,
    isInEditorFirstStep,
    isInEditorLastStep,
    stepTypeCheckPoint,
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

  const editorStepsNum = computed(() => editorSteps.value.length)
  const canvasStepsNum = computed(() => canvasSteps.value.length)

  const isInFirstStep = computed(() => isInEditorFirstStep.value && isInCanvasFirstStep.value)
  const isInLastStep = computed(() => isInEditorLastStep.value && isInCanvasLastStep.value)

  const undo = () => {
    if (isInFirstStep.value || isProcessingStepsQueue.value) return
    if (stepsTypesArr.value[currStepTypeIndex.value] === 'editor') {
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
    if (stepsTypesArr.value[currStepTypeIndex.value] === 'editor') {
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
    return (
      (stepsUtils.steps.length !== 1 && !stepsUtils.isInFirstStep) ||
      (canvasSteps.value.length !== 1 && !isInCanvasFirstStep.value)
    )
  })

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

  watch(editorStepsNum, (newVal, oldVal) => {
    // skip the init state
    if (oldVal === 0 && newVal === 1) return
    stepsTypesArr.value.length = currStepTypeIndex.value + 1
    pushStepType('editor')
    setCurrStepTypeIndex(currStepTypeIndex.value + 1)
    canvasSteps.value.length = canvasCurrStep.value + 1
  })

  watch(canvasStepsNum, (newVal, oldVal) => {
    // skip the init state
    if (oldVal === 0 && newVal === 1) return
    stepsTypesArr.value.length = currStepTypeIndex.value + 1
    pushStepType('canvas')
    setCurrStepTypeIndex(currStepTypeIndex.value + 1)
    editorSteps.value.length = editorCurrStep.value + 1
  })

  return {
    undo,
    redo,
    reset,
    isInFirstStep,
    isInLastStep,
    setCheckpoint,
    goToCheckpoint,
    canvasRecord,
    hasUnsavedChanges,
  }
}

export default useSteps
