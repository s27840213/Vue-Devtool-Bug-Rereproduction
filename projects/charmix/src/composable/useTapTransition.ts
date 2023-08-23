import { useEventListener } from '@vueuse/core'
import { ref } from 'vue'

const useTapTransition = (
  el: HTMLElement | null | Ref<HTMLElement | null> | Array<Ref<HTMLElement | null>>,
  bool: Ref<boolean> | boolean,
  delayTime = 200
) => {
  const timerId = ref(-1)

  const registerEvent = () => {
    const isArray = Array.isArray(el)
    if (!isArray) {
      useEventListener(el, 'touchstart', (e) => {
        isRef(bool) ? (bool.value = true) : (bool = true)
        if (timerId.value) {
          clearTimeout(timerId.value)
          timerId.value = -1
        }
      })

      useEventListener(el, 'touchend', (e) => {
        timerId.value = setTimeout(() => {
          isRef(bool) ? (bool.value = false) : (bool = false)
        }, delayTime)
      })
    } else {
      el.forEach((element) => {
        useEventListener(element, 'touchstart', (e) => {
          isRef(bool) ? (bool.value = true) : (bool = true)
          if (timerId.value) {
            clearTimeout(timerId.value)
            timerId.value = -1
          }
        })

        useEventListener(element, 'touchend', (e) => {
          timerId.value = setTimeout(() => {
            isRef(bool) ? (bool.value = false) : (bool = false)
          }, delayTime)
        })
      })
    }
  }

  onMounted(() => {
    registerEvent()
  })
}

export default useTapTransition
