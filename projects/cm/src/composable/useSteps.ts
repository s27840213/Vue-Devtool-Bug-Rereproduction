import { useEditorStore } from '@/stores/editor'
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
  } = editorStore
  const {
    editorCurrStep,
    editorSteps,
    stepsTypesArr,
    currStepTypeIndex,
    isInEditorFirstStep,
    isInEditorLastStep,
  } = storeToRefs(editorStore)

  const {
    undo: canvasUndo,
    redo: canvasRedo,
    reset: canvasReset,
    isInCanvasFirstStep,
    isInCanvasLastStep,
    steps: canvasSteps,
    currStep: canvasCurrStep,
    isProcessingCanvas,
    isProcessingStepsQueue,
  } = useCanvasUtils()

  const editorStepsNum = computed(() => editorSteps.value.length)
  const canvasStepsNum = computed(() => canvasSteps.value.length)

  const isInFirstStep = computed(() => isInEditorFirstStep.value && isInCanvasFirstStep.value)
  const isInLastStep = computed(() => isInEditorLastStep.value && isInCanvasLastStep.value)

  const undo = () => {
    /**
     * @Note don't remove, still have tiny errors
     */
    console.log(stepsTypesArr.value)
    console.log(
      currStepTypeIndex.value,
      isInEditorFirstStep.value,
      isInCanvasFirstStep.value,
      stepsTypesArr.value[currStepTypeIndex.value],
    )
    if (isInFirstStep.value || isProcessingCanvas.value || isProcessingStepsQueue.value) return
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
    if (isInLastStep.value || isProcessingCanvas.value || isProcessingStepsQueue.value) return
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

  const reset = () => {
    stepsReset()
    canvasReset()
    resetStepsTypesArr()
  }

  watch(editorStepsNum, () => {
    stepsTypesArr.value.length = currStepTypeIndex.value + 1
    pushStepType('editor')
    setCurrStepTypeIndex(currStepTypeIndex.value + 1)
    canvasSteps.value.length = canvasCurrStep.value + 1
  })

  watch(canvasStepsNum, () => {
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
  }
}

export default useSteps
