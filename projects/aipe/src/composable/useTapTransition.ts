import { useEventListener } from '@vueuse/core'
import { ref } from 'vue'

const useTapTransition = (el: Ref<HTMLElement | null>, bool: Ref<boolean>, delayTime = 200) => {
  const timerId = ref(-1)

  const registerEvent = () => {
    useEventListener(el, 'pointerdown', (e) => {
      bool.value = true
      if (timerId.value) {
        clearTimeout(timerId.value)
        timerId.value = -1
      }
    })

    useEventListener(el, 'pointerup', (e) => {
      timerId.value = setTimeout(() => {
        bool.value = false
      }, delayTime)
    })
  }

  onMounted(() => {
    registerEvent()
  })
}

export default useTapTransition
