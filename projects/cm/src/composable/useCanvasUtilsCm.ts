import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import store from '@nu/vivi-lib/store'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import pointerEvtUtils from '@nu/vivi-lib/utils/pointerEvtUtils'
import { useEventListener } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import useBiColorEditor from './useBiColorEditor'
import useMouseUtils from './useMouseUtils'

export interface ICanvasParams {
  width: number
  height: number
}
const useCanvasUtils = (
  sourceCanvas?: Ref<HTMLCanvasElement | null>,
  wrapperRef?: Ref<HTMLElement | null>,
  editorContainerRef?: Ref<HTMLElement | null>,
) => {
  // #region MouseUtils Store & Editor Store
  const mouseUtils = useMouseUtils()
  const { getMousePosInTarget } = mouseUtils
  const editorStore = useEditorStore()
  const { showBrushOptions, maskDataUrl, maskParams, currActiveFeature } = storeToRefs(editorStore)

  const { isBiColorEditor } = useBiColorEditor()
  // #endregion

  // #region canvasStore
  const canvasStore = useCanvasStore()
  const {
    setCanvas,
    setCanvasCtx,
    setCurrStep,
    pushStep,
    clearStep,
    setIsAutoFilling,
    setIsProcessingStepsQueue,
    pushToStepsQueue,
    setCheckPointStep,
  } = canvasStore
  const {
    brushSize,
    resultCanvas,
    canvasMode,
    isProcessingStepsQueue,
    loading,
    isChangingBrushSize,
    isDrawing,
    canvas,
    canvasCtx,
    currCanvasImageElement,
    steps,
    currStep,
    stepsQueue,
    isInCanvasFirstStep,
    isInCanvasLastStep,
    drawingColor,
    checkPointStep,
    isAutoFilling,
  } = storeToRefs(canvasStore)

  const isManipulatingCanvas = computed(() => currActiveFeature.value === 'cm_brush')

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
        setIsProcessingStepsQueue(true)
        const blob = await stepsQueue.value.shift()
        if (blob) {
          pushStep(blob)
        }
      }

      setIsProcessingStepsQueue(false)
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

  const getBrushColor = (color: string) => {
    const mapColorDrawingToBrush = new Map([['#FF7262', '#fcaea9']])

    // darken or lighten color
    const adjustColor = (color: string) => {
      // #FFF not supportet rather use #FFFFFF
      const clamp = (val: number) => Math.min(Math.max(val, 0), 0xff)
      const fill = (str: string) => ('00' + str).slice(-2)
      let offset = 100

      const num = parseInt(color.replace(/^#/, ''), 16)
      let red = num >> 16
      let green = (num >> 8) & 0x00ff
      let blue = num & 0x0000ff
      if (red * 0.299 + green * 0.587 + blue * 0.114 > 186) offset = -offset // https://stackoverflow.com/a/3943023/112731
      red = clamp(red + offset)
      green = clamp(green + offset)
      blue = clamp(blue + offset)
      return '#' + fill(red.toString(16)) + fill(green.toString(16)) + fill(blue.toString(16))
    }

    if (mapColorDrawingToBrush.has(color)) return mapColorDrawingToBrush.get(color)
    return adjustColor(color)
  }

  const showBrush = ref(false)
  const pageScaleRatio = computed(() => store.getters.getPageScaleRatio)

  const brushPos = reactive({ x: 0, y: 0 })

  const brushStyle = computed(() => {
    return {
      backgroundColor: getBrushColor(drawingColor.value),
      width: `${brushSize.value * contentScaleRatio.value * pageScaleRatio.value * 0.01}px`,
      height: `${brushSize.value * contentScaleRatio.value * pageScaleRatio.value * 0.01}px`,
      transform: `translate(${brushPos.x}px, ${brushPos.y}px)`,
    }
  })

  watch(brushSize, (newBrushSize) => {
    if (canvasCtx && canvasCtx.value) {
      canvasCtx.value.lineWidth = newBrushSize
    }
  })

  const isBrushMode = computed(() => {
    return canvasMode.value === 'brush'
  })

  const isEraseMode = computed(() => {
    return canvasMode.value === 'erase'
  })

  const isMovingMode = computed(() => {
    return canvasMode.value === 'move'
  })

  const brushColor = computed(() => {
    return isBrushMode ? getBrushColor(drawingColor.value) : '#fdd033'
  })

  const createInitCanvas = (canvas = sourceCanvas?.value, width: number, height: number) => {
    if (canvas) {
      canvas.width = width
      canvas.height = height

      setCanvas(canvas)
      const targetCtx = canvas.getContext('2d')
      targetCtx && setCanvasCtx(targetCtx)
      if (targetCtx) {
        targetCtx.strokeStyle = drawingColor.value
        targetCtx.lineWidth = brushSize.value
        targetCtx.lineCap = 'round'
        targetCtx.lineJoin = 'round'
      }
    }

    return canvasCtx
  }

  const fillNonTransparent = (color: string) => {
    if (canvas && canvas.value && canvasCtx && canvasCtx.value) {
      canvasCtx.value.globalCompositeOperation = 'source-atop'
      canvasCtx.value.fillStyle = color
      canvasCtx.value.fillRect(0, 0, canvas.value.width, canvas.value.height)
    }
  }

  const copyCanvas = (originalCanvas: HTMLCanvasElement) => {
    // Create a new canvas element
    const copiedCanvas = document.createElement('canvas')
    copiedCanvas.width = originalCanvas.width
    copiedCanvas.height = originalCanvas.height

    // Get the 2D context for both canvases
    const originalContext = originalCanvas.getContext('2d')
    const copiedContext = copiedCanvas.getContext('2d')

    // Draw the content of the original canvas onto the new canvas
    copiedContext && copiedContext.drawImage(originalCanvas, 0, 0)

    return copiedCanvas
  }

  // update strokeStyle and brush color on drawingColor change
  watch(drawingColor, (newVal) => {
    if (canvasCtx && canvasCtx.value) {
      if (isBiColorEditor.value) fillNonTransparent(newVal)
      canvasCtx.value.strokeStyle = newVal
    }
  })

  const updateCanvasSize = (
    targetCanvas = canvas.value,
    width = pageSize.value.width,
    height = pageSize.value.height,
  ) => {
    if (targetCanvas) {
      targetCanvas.width = width
      targetCanvas.height = height
      createInitCanvas(targetCanvas, width, height)
    }
  }

  // #region Drawing methods
  const drawLine = (e: PointerEvent) => {
    if (canvasCtx && canvasCtx.value && editorContainerRef && editorContainerRef.value) {
      canvasCtx.value.beginPath()
      canvasCtx.value.moveTo(initPos.x, initPos.y)
      const { x, y } = getMousePosInTarget(e, editorContainerRef.value)
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
      brushPos.x =
        x * contentScaleRatio.value * pageUtils.scaleRatio * 0.01 -
        (brushSize.value * contentScaleRatio.value * pageUtils.scaleRatio * 0.01) / 2 +
        pageUtils.getCurrPage.x

      brushPos.y =
        y * contentScaleRatio.value * pageUtils.scaleRatio * 0.01 -
        (brushSize.value * contentScaleRatio.value * pageUtils.scaleRatio * 0.01) / 2 +
        pageUtils.getCurrPage.y
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
    if (pointerEvtUtils.pointerIds.length !== 1) return

    if (
      showBrushOptions.value &&
      (isBrushMode.value || isEraseMode.value) &&
      !loading.value &&
      editorContainerRef &&
      editorContainerRef.value
    ) {
      const { x, y } = getMousePosInTarget(e, editorContainerRef.value)
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
    if (pointerEvtUtils.pointerIds.length !== 1) {
      showBrush.value = false
      return
    }
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
      if (isManipulatingCanvas.value) {
        if (isEraseMode.value) {
          setCompositeOperationMode('destination-out')
        } else {
          setCompositeOperationMode('source-over')
        }
      }
    }
  }
  // #endregion

  onMounted(() => {
    if (wrapperRef && editorContainerRef) {
      createInitCanvas(sourceCanvas?.value, pageSize.value.width, pageSize.value.height)
      clearDrawStart = useEventListener(editorContainerRef, 'pointerdown', drawStart)
      useEventListener(editorContainerRef, 'pointermove', setBrushPos)
      useEventListener(editorContainerRef, 'touchstart', disableTouchEvent)
      if (canvasCtx && canvasCtx.value) {
        canvasCtx.value.fillStyle = drawingColor.value
      }
      restoreCanvas()
    }

    watch(isManipulatingCanvas, (newVal) => {
      if (!newVal) {
        setCompositeOperationMode('source-over')
      }
    })
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

  const autoFill = async () => {
    if (isAutoFilling.value) return

    if (canvas && canvas.value) {
      groupUtils.deselect()
      setIsAutoFilling(true)
      mapEditorToCanvas(async (img) => {
        if (canvasCtx && canvasCtx.value) {
          const tmpCanvas = document.createElement('canvas')
          tmpCanvas.width = pageSize.value.width
          tmpCanvas.height = pageSize.value.height
          const tmpCtx = tmpCanvas.getContext('2d') as CanvasRenderingContext2D
          tmpCtx?.drawImage(img, 0, 0, pageSize.value.width, pageSize.value.height)

          tmpCtx.globalCompositeOperation = 'source-out'
          tmpCtx.fillStyle = drawingColor.value
          tmpCtx.fillRect(0, 0, pageSize.value.width, pageSize.value.height)

          canvasCtx.value.save()
          canvasCtx.value.shadowBlur = 0 // Blur level
          canvasCtx.value.shadowColor = drawingColor.value // Color
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

          // after drawImage, the canvas will be cleared
          // X offset loop

          for (const dir of shiftDir) {
            const [xDir, yDir] = dir
            canvasCtx.value.shadowOffsetX = 5 * xDir // X offset
            canvasCtx.value.shadowOffsetY = 5 * yDir // Y offset

            // don't know why sometimes the drawImage will failed after undo/redo
            canvasCtx.value.drawImage(tmpCanvas, 0, 0, pageSize.value.width, pageSize.value.height)
          }
          canvasCtx.value.restore()
          record()

          setIsAutoFilling(false)
          tmpCanvas.remove()
        }
      })
    }
  }

  const prepareMaskToUpload = () => {
    if (canvas && canvas.value) {
      const canvasCopy = document.createElement('canvas')
      canvasCopy.width = canvas.value.width
      canvasCopy.height = canvas.value.height
      const maskCtxCopy = canvasCopy.getContext('2d')
      if (maskCtxCopy) {
        maskCtxCopy.drawImage(canvas.value, 0, 0)
        const pixels = maskCtxCopy.getImageData(0, 0, pageSize.value.width, pageSize.value.height)
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
            result.data[i] = 0
            result.data[i + 1] = 0
            result.data[i + 2] = 0
            result.data[i + 3] = 255
          } else {
            // If the pixel is not transparent, set it to white.
            result.data[i] = 255
            result.data[i + 1] = 255
            result.data[i + 2] = 255
            result.data[i + 3] = 255
          }
        }
        maskCtxCopy.putImageData(result, 0, 0)
        return canvasCopy.toDataURL('image/png')
      }
    }
  }

  const convertToPinkBasedMask = (
    maskUrl: string,
    width: number,
    height: number,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvasCopy = document.createElement('canvas')
      canvasCopy.width = width
      canvasCopy.height = height
      const maskCtxCopy = canvasCopy.getContext('2d')

      if (maskCtxCopy) {
        const img = new Image()
        img.src = maskUrl
        img.crossOrigin = 'Anonymous'

        img.onload = () => {
          maskCtxCopy.drawImage(img, 0, 0, pageSize.value.width, pageSize.value.height)
          const pixels = maskCtxCopy.getImageData(0, 0, pageSize.value.width, pageSize.value.height)
          const result = new ImageData(
            new Uint8ClampedArray(pixels.data),
            pageSize.value.width,
            pageSize.value.height,
          )
          // The total number of pixels (RGBA values).
          const bufferSize = result.data.length

          // Check the alpha (transparency) value of each pixel.
          for (let i = 0; i < bufferSize; i += 4) {
            // if the pixel is transparent or pink, don't change it
            if (
              result.data[i + 3] === 0 ||
              (result.data[i] === 255 && result.data[i + 1] === 114 && result.data[i + 2] === 98)
            ) {
              break
            } else {
              // If the pixel is not transparent or pink, set it We may have 2 cases:
              // 1. The pixel is white, we set it to pink.
              // 2. The pixel is black, we set it to transparent.
              if (
                // white
                result.data[i] === 255 &&
                result.data[i + 1] === 255 &&
                result.data[i + 2] === 255
              ) {
                result.data[i] = 255
                result.data[i + 1] = 114
                result.data[i + 2] = 98
                result.data[i + 3] = 255
              } else if (
                // black
                result.data[i] === 0 &&
                result.data[i + 1] === 0 &&
                result.data[i + 2] === 0
              ) {
                result.data[i + 3] = 0
              } else {
                reject(new Error('Unexpected color'))
              }
            }
          }
          maskCtxCopy.putImageData(result, 0, 0)

          resolve(canvasCopy.toDataURL('image/png'))
        }

        img.onerror = () => {
          reject(new Error('Failed to load image'))
        }
      }
    })
  }

  const downloadCanvas = async (targetCanvas = canvas.value) => {
    if (targetCanvas) {
      const dataUrl = targetCanvas.toDataURL('image/png')
      await cmWVUtils.saveAssetFromUrl('png', dataUrl, `test/${generalUtils.generateAssetId()}`)
      // generalUtils.downloadImage(dataUrl, 'mask.png')
    }
  }

  const getCanvasDataUrl = () => {
    if (canvas && canvas.value) {
      return canvas.value.toDataURL('image/png')
    }
  }

  const mapEditorToCanvas = async (cb?: (img: HTMLImageElement) => void) => {
    const { width: pageWidth, height: pageHeight } = pageSize.value
    const size = Math.max(pageWidth, pageHeight)
    const { flag, imageId, cleanup } = cmWVUtils.checkVersion('1.0.18')
      ? await cmWVUtils.sendScreenshotUrl(cmWVUtils.createUrlForJSON({ noBg: true }), {
          outputType: 'png',
        })
      : await cmWVUtils.copyEditor(
          {
            width: pageWidth * contentScaleRatio.value,
            height: pageHeight * contentScaleRatio.value,
          },
          true,
        )
    if (flag !== '0') {
      logUtils.setLogAndConsoleLog('Screenshot Failed')
      throw new Error('Screenshot Failed')
    }

    setIsAutoFilling(false)
    imageUtils.imgLoadHandler(`chmix://screenshot/${imageId}?lsize=${size}`, async (img) => {
      if (canvasCtx && canvasCtx.value) {
        cb && cb(img)
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

  const restoreCanvas = () => {
    if (maskDataUrl.value) {
      const img = new Image()

      img.crossOrigin = 'Anonymous'
      img.src = maskDataUrl.value
      img.onload = () => {
        clearCtx()
        drawImageToCtx(img, {
          x: maskParams.value.x ?? 0,
          y: maskParams.value.y ?? 0,
          width: maskParams.value.width ?? pageSize.value.width,
          height: maskParams.value.height ?? pageSize.value.height,
        })
        if (isBiColorEditor.value) fillNonTransparent(drawingColor.value)
      }
    }
  }

  const record = () => {
    /**
     * DataUrl for png is TOO slow for the project, so I change to use the toBlob method
     */
    // const base64 = this.canvas.toDataURL('image/png', 0.3)
    if (canvas.value) {
      const blobPromise = getCanvasBlob(canvas.value)
      if (blobPromise !== null) {
        pushToStepsQueue(blobPromise)
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
        if (isBiColorEditor.value) fillNonTransparent(drawingColor.value)
        URL.revokeObjectURL(url)
      }
    }
  }

  const redo = () => {
    if (!isProcessingStepsQueue.value && !isInCanvasLastStep.value) {
      setCurrStep(currStep.value + 1)
      const url = updateCurrCanvasImageElement()

      currCanvasImageElement.value.onload = () => {
        clearCtx()
        drawImageToCtx(currCanvasImageElement.value)
        if (isBiColorEditor.value) fillNonTransparent(drawingColor.value)

        URL.revokeObjectURL(url)
      }
    }
  }

  const goToCheckpoint = () => {
    if (checkPointStep.value !== -1) {
      setCurrStep(checkPointStep.value)
      const url = updateCurrCanvasImageElement()

      currCanvasImageElement.value.onload = () => {
        clearCtx()
        drawImageToCtx(currCanvasImageElement.value)
        if (isBiColorEditor.value) fillNonTransparent(drawingColor.value)

        URL.revokeObjectURL(url)

        steps.value.length = checkPointStep.value + 1
        setCheckPointStep(-1)
      }
    }
  }

  const reset = () => {
    clearStep()
    record()
  }

  return {
    reverseSelection,
    downloadCanvas,
    getCanvasDataUrl,
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
    restoreCanvas,
    prepareMaskToUpload,
    convertToPinkBasedMask,
    goToCheckpoint,
    setCheckPointStep,
    isInCanvasFirstStep,
    isInCanvasLastStep,
    brushSize,
    brushColor,
    brushStyle,
    showBrush,
    isBrushMode,
    resultCanvas,
    currStep,
    isProcessingStepsQueue,
    loading,
    steps,
    isChangingBrushSize,
  }
}

export default useCanvasUtils
