import { useEditorStore } from '@/stores/editor'
import { storeToRefs } from 'pinia'

const useMouseUtils = () => {
  const editorStore = useEditorStore()
  const { pageScaleRatio } = storeToRefs(editorStore)

  const getEventType = (e: MouseEvent | TouchEvent | PointerEvent) => {
    if (e.type.includes('pointer')) {
      return 'pointer'
    } else if (e.type.includes('mouse')) {
      return 'mouse'
    } else if (e.type.includes('touch')) {
      return 'touch'
    } else {
      // default
      return 'mouse'
    }
  }

  const getMouseAbsPoint = (e: MouseEvent | TouchEvent | PointerEvent) => {
    const type = getEventType(e)
    const x =
      type === 'pointer'
        ? (e as PointerEvent).clientX
        : type === 'mouse'
        ? (e as MouseEvent).clientX
        : (e as TouchEvent).touches[0].clientX
    const y =
      type === 'pointer'
        ? (e as PointerEvent).clientY
        : type === 'mouse'
        ? (e as MouseEvent).clientY
        : (e as TouchEvent).touches[0].clientY
    return {
      x,
      y
    }
  }

  const getMouseRelPoint = (
    e: MouseEvent | TouchEvent | PointerEvent,
    target: HTMLElement | { x: number; y: number }
  ) => {
    let x: number
    let y: number
    const type = getEventType(e)
    const clientX =
      type === 'pointer'
        ? (e as PointerEvent).clientX
        : type === 'mouse'
        ? (e as MouseEvent).clientX
        : (e as TouchEvent).touches[0].clientX
    const clientY =
      type === 'pointer'
        ? (e as PointerEvent).clientY
        : type === 'mouse'
        ? (e as MouseEvent).clientY
        : (e as TouchEvent).touches[0].clientY
    if (target instanceof HTMLElement) {
      const rect = target.getBoundingClientRect()
      x = clientX + target.scrollLeft - rect.left
      y = clientY + target.scrollTop - rect.top
    } else {
      x = clientX - target.x
      y = clientY - target.y
    }
    return { x, y }
  }

  const getMousePosInTarget = (
    e: MouseEvent | TouchEvent | PointerEvent,
    target: HTMLElement
  ): { x: number; y: number; xPercentage: number; yPercentage: number } => {
    const mouseRelPos = getMouseRelPoint(e, target)
    return {
      x: mouseRelPos.x / pageScaleRatio.value,
      y: mouseRelPos.y / pageScaleRatio.value,
      xPercentage: mouseRelPos.x / target.clientWidth,
      yPercentage: mouseRelPos.y / target.clientHeight
    }
  }

  return {
    getMouseAbsPoint,
    getMouseRelPoint,
    getMousePosInTarget
  }
}

export default useMouseUtils
