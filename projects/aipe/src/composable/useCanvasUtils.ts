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
  targetCanvas: Ref<HTMLCanvasElement | null>,
  wrapperRef: Ref<HTMLElement | null>,
  editorContainerRef: Ref<HTMLElement | null>,
  params: ICanvasParams
) => {
  // #region MouseUtils Store & Editor Store
  const mouseUtils = useMouseUtils()
  const { getMousePosInTarget } = mouseUtils
  const editorStore = useEditorStore()
  const { editorMode } = storeToRefs(editorStore)
  // #endregion

  // #region canvasStore
  const canvasStore = useCanvasStore()
  const {
    brushSize,
    canvas,
    currStep,
    inCanvasMode,
    isProcessing,
    loading,
    steps,
    isChangingBrushSize
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
  const canvasWidth = ref(params.width)
  const canvasHeight = ref(params.height)
  const isDrawing = ref(false)
  const ctx = ref<CanvasRenderingContext2D | null>(null)
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

    if (ctx && ctx.value) {
      ctx.value.lineWidth = newVal
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
      ctx.value = targetCanvas.value.getContext('2d')
      if (ctx && ctx.value) {
        ctx.value.strokeStyle = '#FF7262'
        ctx.value.lineWidth = brushSize.value
        ctx.value.lineCap = 'round'
        ctx.value.lineJoin = 'round'
      }
    }

    return ctx
  }

  const drawLine = (e: PointerEvent) => {
    if (ctx && ctx.value && wrapperRef && wrapperRef.value) {
      ctx.value.beginPath()
      ctx.value.moveTo(initPos.x, initPos.y)
      const { x, y } = mouseUtils.getMousePosInTarget(e, wrapperRef.value)
      // showMagnifyAtRight = xPercentage < 0.25 && yPercentage < 0.25
      ctx.value.lineTo(x, y)
      ctx.value.stroke()
      Object.assign(initPos, {
        x,
        y
      })
    }
  }

  const setBrushPos = (e: PointerEvent) => {
    if (wrapperRef && wrapperRef.value) {
      const { x, y } = mouseUtils.getMousePosInTarget(e, wrapperRef.value)
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
      const { x, y } = mouseUtils.getMousePosInTarget(e, wrapperRef.value)
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
    if (ctx && ctx.value) {
      ctx.value.globalCompositeOperation = mode
    }
  }

  const clearCtx = () => {
    if (ctx && ctx.value) {
      ctx.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
    }
  }

  const drawInEraseMode = (e: PointerEvent) => {
    if (ctx && ctx.value) {
      setCompositeOperationMode('destination-out')
      drawLine(e)
    }
  }

  const drawInBrushMode = (e: PointerEvent) => {
    setCompositeOperationMode('source-over')
    drawLine(e)
  }

  onMounted(() => {
    createInitCanvas(canvasWidth.value, canvasHeight.value)

    useEventListener(editorContainerRef, 'pointerdown', drawStart)
    useEventListener(editorContainerRef, 'pointermove', setBrushPos)
    useEventListener(editorContainerRef, 'touchstart', disableTouchEvent)
  })

  return {
    setCanvasStoreState,
    brushSize,
    brushColor,
    brushStyle,
    showBrush,
    isBrushMode,
    canvas,
    currStep,
    inCanvasMode,
    isProcessing,
    loading,
    steps,
    isChangingBrushSize
  }
}

export default useCanvasUtils
