import { useEventListener } from '@vueuse/core'
import { Ref, onActivated, onMounted, onUpdated, watch, nextTick } from 'vue'

const dict = new Map<string, [number, number]>()

const useKeepScrollPosition = (target: Ref<HTMLElement | null>, content: Ref<unknown[]>) => {
  onMounted(() => {
    if (content.value.toString()) {
      dict.set(content.value.toString(), [0, 0])
    }
    useEventListener(target, 'scroll', () => {
      if (!target.value) return
      dict.set(content.value.toString(), [target.value.scrollLeft, target.value.scrollTop])
    }, { passive: true })
  })

  const restorePosition = () => {
    nextTick(() => {
      const positions = dict.get(content.value.toString())

      if (!target.value || !positions) return;
      [target.value.scrollLeft, target.value.scrollTop] = positions
    })
  }
  
  onActivated(restorePosition) 
  onUpdated(restorePosition)

  watch(content, (newVal, oldVal) => {
    const [newStr, oldStr] = [newVal.toString(), oldVal.toString()]

    // No content / no change, skip.
    if (!newStr || newStr === oldStr) return

    const positions = dict.get(oldStr)
    // Content load more, treat it as identical, and inherit its position.
    if (oldStr && newStr.startsWith(oldStr) && positions) {
      dict.delete(oldStr)
      dict.set(newStr, positions)
      return
    }

    // Init its position
    dict.set(newStr, [0, 0])
  })
}

export default useKeepScrollPosition
