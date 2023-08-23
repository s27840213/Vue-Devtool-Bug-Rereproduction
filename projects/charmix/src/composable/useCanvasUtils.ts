import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import { useEventListener } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import useMouseUtils from './useMouseUtils'

export interface ICanvasParams {
  width: number
  height: number
}
const useCanvasUtils = (
  targetCanvas?: Ref<HTMLCanvasElement | null>,
  wrapperRef?: Ref<HTMLElement | null>,
  editorContainerRef?: Ref<HTMLElement | null>
) => {
  // #region MouseUtils Store & Editor Store
  const mouseUtils = useMouseUtils()
  const { getMousePosInTarget } = mouseUtils
  const editorStore = useEditorStore()
  const { editorMode, firstPaintArea } = storeToRefs(editorStore)
  // #endregion

  // #region canvasStore
  const canvasStore = useCanvasStore()
  const {
    brushSize,
    resultCanvas,
    currStep,
    inCanvasMode,
    isProcessing,
    loading,
    steps,
    isChangingBrushSize,
    canvasWidth,
    canvasHeight,
    isDrawing,
    canvasCtx
  } = storeToRefs(canvasStore)

  const { setCanvasStoreState } = canvasStore
  // #endregion

  const disableTouchEvent = (e: TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // #region Canvas States
  const pointerStartPos = reactive({ x: 0, y: 0 })
  const initPos = reactive({ x: 0, y: 0 })
  // #endregion

  const showBrush = ref(false)

  const brushStyle = reactive({
    backgroundColor: '#fcaea9',
    width: '16px',
    height: '16px',
    transform: 'translate(0,0)'
  })

  watch(brushSize, (newVal) => {
    brushStyle.width = `${newVal}px`
    brushStyle.height = `${newVal}px`

    if (canvasCtx && canvasCtx.value) {
      canvasCtx.value.lineWidth = newVal
    }
  })

  const isBrushMode = computed(() => {
    return editorMode.value === 'brush'
  })

  const isEraseMode = computed(() => {
    return editorMode.value === 'erase'
  })

  const isMovingMode = computed(() => {
    return editorMode.value === 'erase'
  })

  const brushColor = computed(() => {
    return isBrushMode ? '#fcaea9' : '#fdd033'
  })

  const createInitCanvas = (width: number, height: number) => {
    if (targetCanvas && targetCanvas.value) {
      targetCanvas.value.width = width
      targetCanvas.value.height = height
      canvasCtx.value = targetCanvas.value.getContext('2d')
      if (canvasCtx && canvasCtx.value) {
        canvasCtx.value.strokeStyle = '#FF7262'
        canvasCtx.value.lineWidth = brushSize.value
        canvasCtx.value.lineCap = 'round'
        canvasCtx.value.lineJoin = 'round'
      }
    }

    return canvasCtx
  }

  const drawLine = (e: PointerEvent) => {
    if (canvasCtx && canvasCtx.value && wrapperRef && wrapperRef.value) {
      canvasCtx.value.beginPath()
      canvasCtx.value.moveTo(initPos.x, initPos.y)
      const { x, y } = getMousePosInTarget(e, wrapperRef.value)
      // showMagnifyAtRight = xPercentage < 0.25 && yPercentage < 0.25
      canvasCtx.value.lineTo(x, y)
      canvasCtx.value.stroke()
      Object.assign(initPos, {
        x,
        y
      })
    }
  }

  const setBrushPos = (e: PointerEvent) => {
    if (wrapperRef && wrapperRef.value) {
      const { x, y } = getMousePosInTarget(e, wrapperRef.value)
      brushStyle.transform = `translate(${x - brushSize.value / 2}px, ${y - brushSize.value / 2}px)`
    }
  }

  const drawStart = (e: PointerEvent) => {
    if (
      (isBrushMode.value || isEraseMode.value) &&
      !loading.value &&
      wrapperRef &&
      wrapperRef.value
    ) {
      const { x, y } = getMousePosInTarget(e, wrapperRef.value)
      pointerStartPos.x = e.clientX
      pointerStartPos.y = e.clientY
      Object.assign(initPos, {
        x,
        y
      })

      showBrush.value = true
      setBrushPos(e)

      useEventListener(editorContainerRef, 'pointermove', drawing)
      useEventListener(editorContainerRef, 'pointerup', drawEnd)
    }
  }
  const drawing = (e: PointerEvent) => {
    if (isBrushMode.value || isEraseMode.value) {
      const pointerCurrentX = e.clientX
      const pointerCurrentY = e.clientY

      const distanceX = Math.abs(pointerCurrentX - pointerStartPos.x)
      const distanceY = Math.abs(pointerCurrentY - pointerStartPos.y)

      pointerStartPos.x = pointerCurrentX
      pointerStartPos.y = pointerCurrentY

      const threshold = 0.5
      if (isDrawing.value || distanceX > threshold || distanceY > threshold) {
        isDrawing.value = true
        // Trigger your pointermove event here
        if (isBrushMode.value) {
          drawInBrushMode(e)
        } else {
          drawInEraseMode(e)
        }
      }
    }
  }
  const drawEnd = () => {
    // pushStep()
    isDrawing.value = false
    showBrush.value = false
  }

  const setCompositeOperationMode = (mode: GlobalCompositeOperation) => {
    if (canvasCtx && canvasCtx.value) {
      canvasCtx.value.globalCompositeOperation = mode
    }
  }

  const clearCtx = () => {
    if (canvasCtx && canvasCtx.value) {
      canvasCtx.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
    }
  }

  const drawInEraseMode = (e: PointerEvent) => {
    if (canvasCtx && canvasCtx.value) {
      setCompositeOperationMode('destination-out')
      drawLine(e)
    }
  }

  const drawInBrushMode = (e: PointerEvent) => {
    setCompositeOperationMode('source-over')
    drawLine(e)
  }

  onMounted(() => {
    /**
     * if we didnt pass argument, means we just want to use some utility like reverseSelection
     */
    if (
      targetCanvas &&
      targetCanvas.value &&
      wrapperRef &&
      wrapperRef.value &&
      editorContainerRef &&
      editorContainerRef.value
    ) {
      createInitCanvas(canvasWidth.value, canvasHeight.value)
      useEventListener(editorContainerRef, 'pointerdown', drawStart)
      useEventListener(editorContainerRef, 'pointermove', setBrushPos)
      useEventListener(editorContainerRef, 'touchstart', disableTouchEvent)
      if (canvasCtx && canvasCtx.value) {
        canvasCtx.value.fillStyle = '#ff7262'
        canvasCtx.value.fillRect(0, 0, firstPaintArea.value.width, firstPaintArea.value.height)
      }

      // reverseSelection()
    }
  })

  const reverseSelection = () => {
    if (canvasCtx && canvasCtx.value) {
      const pixels = canvasCtx.value.getImageData(0, 0, canvasWidth.value, canvasHeight.value)
      // The total number of pixels (RGBA values).
      const bufferSize = pixels.data.length
      // Iterate over every pixel to find the boundaries of the non-transparent content.
      for (let i = 0; i < bufferSize; i += 4) {
        // Check the alpha (transparency) value of each pixel.
        if (pixels.data[i + 3] !== 0) {
          // If the pixel is not transparent, set it to transparent.
          pixels.data[i + 3] = 0
        } else {
          // If the pixel is transparent, set it to opaque.
          pixels.data[i] = 255
          pixels.data[i + 1] = 114
          pixels.data[i + 2] = 98
          pixels.data[i + 3] = 255
        }
      }

      canvasCtx.value.putImageData(pixels, 0, 0)
    }
  }

  return {
    setCanvasStoreState,
    reverseSelection,
    brushSize,
    brushColor,
    brushStyle,
    showBrush,
    isBrushMode,
    resultCanvas,
    currStep,
    inCanvasMode,
    isProcessing,
    loading,
    steps,
    isChangingBrushSize
  }
}

export default useCanvasUtils
