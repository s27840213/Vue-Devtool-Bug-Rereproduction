import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import { useEventListener } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import useMouseUtils from './useMouseUtils'

export interface ICanvasParams {
  width: number
  height: number
}
const useCanvasUtils = (
  _targetCanvas?: Ref<HTMLCanvasElement | null>,
  wrapperRef?: Ref<HTMLElement | null>,
  editorContainerRef?: Ref<HTMLElement | null>,
) => {
  // #region MouseUtils Store & Editor Store
  const mouseUtils = useMouseUtils()
  const { getMousePosInTarget } = mouseUtils
  const editorStore = useEditorStore()
  const { showBrushOptions } = storeToRefs(editorStore)

  // #endregion

  // #region canvasStore
  const canvasStore = useCanvasStore()
  const { setCurrStep, pushStep, clearStep } = canvasStore
  const {
    brushSize,
    resultCanvas,
    canvasMode,
    isProcessingCanvas,
    isProcessingStepsQueue,
    loading,
    isChangingBrushSize,
    isDrawing,
    maskCanvas,
    canvas,
    canvasCtx,
    currCanvasImageElement,
    steps,
    currStep,
    stepsQueue,
    isInCanvasFirstStep,
    isInCanvasLastStep,
  } = storeToRefs(canvasStore)

  const targetCanvas = computed(() => _targetCanvas?.value || canvas.value)

  const { setCanvasStoreState } = canvasStore
  // #endregion

  // #region page related
  const { pageSize, contentScaleRatio } = storeToRefs(useEditorStore())
  // #endregion

  watch(
    stepsQueue,
    async () => {
      if (isProcessingStepsQueue.value) {
        return
      }
      while (stepsQueue.value.length !== 0) {
        isProcessingStepsQueue.value = true
        const blob = await stepsQueue.value.shift()
        if (blob) {
          pushStep(blob)
        }
      }

      isProcessingStepsQueue.value = false
    },
    {
      deep: true,
    },
  )

  const disableTouchEvent = (e: TouchEvent) => {
    const enableTouchEventFlag = (e.target as HTMLElement).classList.contains('sidebar__tab')
    if (showBrushOptions.value && !enableTouchEventFlag) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  // #region Canvas Mouse States
  const pointerStartPos = reactive({ x: 0, y: 0 })
  const initPos = reactive({ x: 0, y: 0 })
  // #endregion

  const showBrush = ref(false)

  const brushStyle = reactive({
    backgroundColor: '#fcaea9',
    width: '16px',
    height: '16px',
    transform: 'translate(0,0)',
  })

  watch(brushSize, (newVal) => {
    brushStyle.width = `${newVal * contentScaleRatio.value}px`
    brushStyle.height = `${newVal * contentScaleRatio.value}px`

    if (canvasCtx && canvasCtx.value) {
      canvasCtx.value.lineWidth = newVal
    }
  })

  const isBrushMode = computed(() => {
    return canvasMode.value === 'brush'
  })

  const isEraseMode = computed(() => {
    return canvasMode.value === 'erase'
  })

  const isMovingMode = computed(() => {
    return canvasMode.value === 'erase'
  })

  const brushColor = computed(() => {
    return isBrushMode ? '#fcaea9' : '#fdd033'
  })

  const createInitCanvas = (width: number, height: number) => {
    if (targetCanvas && targetCanvas.value) {
      targetCanvas.value.width = width
      targetCanvas.value.height = height
      setCanvasStoreState({
        canvas: targetCanvas.value,
        canvasCtx: targetCanvas.value.getContext('2d'),
      })
      if (canvasCtx && canvasCtx.value) {
        canvasCtx.value.strokeStyle = '#FF7262'
        canvasCtx.value.lineWidth = brushSize.value
        canvasCtx.value.lineCap = 'round'
        canvasCtx.value.lineJoin = 'round'
      }
    }

    return canvasCtx
  }

  const updateCanvasSize = (
    targetCanvas = canvas.value,
    width = pageSize.value.width,
    height = pageSize.value.height,
  ) => {
    if (targetCanvas) {
      targetCanvas.width = width
      targetCanvas.height = height
    }
  }

  // #region Drawing methods
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
        y,
      })
    }
  }

  const setBrushPos = (e: PointerEvent) => {
    if (wrapperRef && wrapperRef.value) {
      const { x, y } = getMousePosInTarget(e, wrapperRef.value)
      brushStyle.transform = `translate(${
        x * contentScaleRatio.value - (brushSize.value * contentScaleRatio.value) / 2
      }px, ${y * contentScaleRatio.value - (brushSize.value * contentScaleRatio.value) / 2}px)`
    }
  }

  let clearDrawStart = () => {
    console.log('init callback')
  }
  let clearDrawing = () => {
    console.log('init callback')
  }
  let clearDrawEnd = () => {
    console.log('init callback')
  }

  const drawStart = (e: PointerEvent) => {
    console.log('drawStart')
    console.log(
      showBrushOptions.value,
      isBrushMode.value || isEraseMode.value,
      !loading.value,
      wrapperRef,
    )
    if (
      showBrushOptions.value &&
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
        y,
      })

      showBrush.value = true
      setBrushPos(e)

      clearDrawing = useEventListener(editorContainerRef, 'pointermove', drawing)
      clearDrawEnd = useEventListener(editorContainerRef, 'pointerup', drawEnd)
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
    clearDrawing()
    clearDrawEnd()

    record()
    isDrawing.value = false
    showBrush.value = false
  }

  const setCompositeOperationMode = (mode: GlobalCompositeOperation) => {
    if (canvasCtx && canvasCtx.value) {
      canvasCtx.value.globalCompositeOperation = mode
    }
  }

  const clearCtx = (ctx?: CanvasRenderingContext2D) => {
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      return
    }
    if (canvasCtx && canvasCtx.value) {
      canvasCtx.value.clearRect(0, 0, pageSize.value.width, pageSize.value.height)
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

  const drawImageToCtx = (
    img: HTMLImageElement,
    options: {
      x?: number
      y?: number
      width?: number
      height?: number
      rotate?: number
    } = {},
  ) => {
    if (canvasCtx && canvasCtx.value && img) {
      setCompositeOperationMode('source-over')
      const {
        x = 0,
        y = 0,
        width = pageSize.value.width,
        height = pageSize.value.height,
        rotate = 0,
      } = options

      canvasCtx.value.save()
      canvasCtx.value.translate(x + width / 2, y + height / 2)
      canvasCtx.value.rotate((rotate * Math.PI) / 180)
      canvasCtx.value.translate(-(x + width / 2), -(y + height / 2))
      canvasCtx.value.drawImage(img, x, y, width, height)
      canvasCtx.value.restore()
      // canvasCtx.value.rotate(-rotate * Math.PI / 180)
      if (isEraseMode.value) {
        setCompositeOperationMode('destination-out')
      } else {
        setCompositeOperationMode('source-over')
      }
    }
  }
  // #endregion

  onMounted(() => {
    if (wrapperRef && wrapperRef.value && editorContainerRef && editorContainerRef.value) {
      createInitCanvas(pageSize.value.width, pageSize.value.height)
      clearDrawStart = useEventListener(editorContainerRef, 'pointerdown', drawStart)
      useEventListener(editorContainerRef, 'pointermove', setBrushPos)
      useEventListener(editorContainerRef, 'touchstart', disableTouchEvent)
      if (canvasCtx && canvasCtx.value) {
        canvasCtx.value.fillStyle = '#ff7262'
        record()
      }
    }
  })

  const reverseSelection = () => {
    if (canvasCtx && canvasCtx.value) {
      const pixels = canvasCtx.value.getImageData(0, 0, pageSize.value.width, pageSize.value.height)
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
      record()
    }
  }

  const autoFill = () => {
    groupUtils.deselect()
    clearCtx()
    setCanvasStoreState({
      isAutoFilling: true,
    })
    mapEditorToCanvas(() => {
      if (canvasCtx && canvasCtx.value) {
        const pixels = canvasCtx.value.getImageData(
          0,
          0,
          pageSize.value.width,
          pageSize.value.height,
        )
        const result = new ImageData(
          new Uint8ClampedArray(pixels.data),
          pageSize.value.width,
          pageSize.value.height,
        )
        // The total number of pixels (RGBA values).
        const bufferSize = pixels.data.length

        // Iterate over every pixel to find the boundaries of the non-transparent content.
        for (let i = 0; i < bufferSize; i += 4) {
          // Check the alpha (transparency) value of each pixel.
          if (pixels.data[i + 3] === 0) {
            // If the pixel is transparent, set it to opaque.
            // const x = (i / 4) % pageSize.value.width
            // const y = Math.floor(i / (4 * pageSize.value.width))

            // for (let dx = -8; dx <= 8; dx++) {
            //   for (let dy = -8; dy <= 8; dy++) {
            //     setPixelColor(x, y, 255, 114, 98)
            //   }
            // }
            result.data[i] = 255
            result.data[i + 1] = 114
            result.data[i + 2] = 98
            result.data[i + 3] = 255
          } else {
            // If the pixel is not transparent, set it to transparent.
            result.data[i + 3] = 0
          }
        }
        canvasCtx.value.putImageData(result, 0, 0)
        const tmpCanvas = document.createElement('canvas')
        tmpCanvas.width = pageSize.value.width
        tmpCanvas.height = pageSize.value.height
        const tmpCtx = tmpCanvas.getContext('2d')
        canvas.value && tmpCtx?.drawImage(canvas.value, 0, 0)
        clearCtx()

        canvasCtx.value.save()
        canvasCtx.value.shadowBlur = 0 // Blur level
        canvasCtx.value.shadowColor = '#ff7262' // Color
        const shiftDir = [
          [0, 1],
          [-1, 0],
          [0, -1],
          [1, 0],
          [1, 1],
          [-1, 1],
          [-1, -1],
          [1, -1],
        ]
        // X offset loop
        for (const dir of shiftDir) {
          const [xDir, yDir] = dir
          canvasCtx.value.shadowOffsetX = 5 * xDir // X offset
          canvasCtx.value.shadowOffsetY = 5 * yDir // Y offset
          canvasCtx.value.drawImage(tmpCanvas, 0, 0, pageSize.value.width, pageSize.value.height)
        }
        canvasCtx.value.restore()
        record()

        setCanvasStoreState({
          isAutoFilling: false,
        })
      }
    })
  }

  const downloadMaskCanvas = () => {
    if (maskCanvas && maskCanvas.value) {
      const dataUrl = maskCanvas.value.toDataURL('image/png')
      generalUtils.downloadImage(dataUrl, 'mask.png')
    }
  }

  const getMaskDaraUrl = () => {
    if (maskCanvas && maskCanvas.value) {
      return maskCanvas.value.toDataURL('image/png')
    }
  }

  const mapEditorToCanvas = async (cb?: () => void) => {
    const { width: pageWidth, height: pageHeight } = pageSize.value
    const size = Math.max(pageWidth, pageHeight)
    const { flag, imageId, cleanup } = await cmWVUtils.copyEditor(
      { width: pageWidth * contentScaleRatio.value, height: pageHeight * contentScaleRatio.value },
      true,
    )
    if (flag !== '0') {
      logUtils.setLogAndConsoleLog('Screenshot Failed')
      throw new Error('Screenshot Failed')
    }
    imageUtils.imgLoadHandler(`chmix://screenshot/${imageId}?lsize=${size}`, (img) => {
      if (canvasCtx && canvasCtx.value) {
        canvasCtx.value.drawImage(img, 0, 0, pageWidth, pageHeight)
        cb && cb()
        cleanup()
      }
    })
  }

  const checkCanvasIsEmpty = (targetCanvasCtx = canvasCtx) => {
    if (targetCanvasCtx && targetCanvasCtx.value) {
      const pixels = targetCanvasCtx.value.getImageData(
        0,
        0,
        pageSize.value.width,
        pageSize.value.height,
      )
      // The total number of pixels (RGBA values).
      const bufferSize = pixels.data.length
      // Iterate over every pixel to find the boundaries of the non-transparent content.
      for (let i = 0; i < bufferSize; i += 4) {
        // Check the alpha (transparency) value of each pixel.
        if (pixels.data[i + 3] !== 0) {
          // If the pixel is not transparent, set it to transparent.
          return false
        }
      }
      return true
    }
  }

  const getCanvasBlob: (mycanvas: HTMLCanvasElement) => Promise<Blob | null> = (
    mycanvas: HTMLCanvasElement,
  ) => {
    return new Promise((resolve, reject) => {
      mycanvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/png')
    })
  }

  const updateCurrCanvasImageElement = (blob?: Blob) => {
    const url = URL.createObjectURL(blob ?? steps.value[currStep.value])

    currCanvasImageElement.value.src = url
    return url
  }

  const record = () => {
    /**
     * DataUrl for png is TOO slow for the project, so I change to use the toBlob method
     */
    // const base64 = this.canvas.toDataURL('image/png', 0.3)
    if (canvas.value) {
      const blobPromise = getCanvasBlob(canvas.value)
      if (blobPromise !== null) {
        stepsQueue.value.push(blobPromise)
      }
    }
  }

  const undo = () => {
    if (!isProcessingStepsQueue.value && !isInCanvasFirstStep.value) {
      setCurrStep(currStep.value - 1)
      const url = updateCurrCanvasImageElement()

      currCanvasImageElement.value.onload = () => {
        clearCtx()
        drawImageToCtx(currCanvasImageElement.value)

        URL.revokeObjectURL(url)
      }
    }
  }

  const redo = () => {
    if (!isProcessingStepsQueue.value && !isInCanvasLastStep.value) {
      setCurrStep(currStep.value + 1)
      updateCurrCanvasImageElement()

      currCanvasImageElement.value.onload = () => {
        clearCtx()
        drawImageToCtx(currCanvasImageElement.value)
      }
    }
  }

  const reset = () => {
    clearStep()
  }

  return {
    setCanvasStoreState,
    reverseSelection,
    downloadMaskCanvas,
    getMaskDaraUrl,
    clearCtx,
    autoFill,
    getCanvasBlob,
    record,
    undo,
    redo,
    reset,
    drawImageToCtx,
    updateCanvasSize,
    checkCanvasIsEmpty,
    isInCanvasFirstStep,
    isInCanvasLastStep,
    brushSize,
    brushColor,
    brushStyle,
    showBrush,
    isBrushMode,
    resultCanvas,
    currStep,
    isProcessingCanvas,
    isProcessingStepsQueue,
    loading,
    steps,
    isChangingBrushSize,
  }
}

export default useCanvasUtils
