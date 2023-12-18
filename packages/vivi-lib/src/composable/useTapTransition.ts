import { useEventListener } from '@vueuse/core'
import { Ref, onMounted, ref } from 'vue'

const useTapTransition = (
  el: null | Ref<HTMLElement |  HTMLElement[] |null>,
  bool: Ref<boolean> | Ref<boolean[]> ,
  delayTime = 200
) => {
  const timerId = ref(-1)

  const registerEvent = () => {
    if(el?.value !== null) {
      const isArray = Array.isArray(el?.value)
      if (!isArray) {
        useEventListener(el as Ref<HTMLElement>, 'touchstart', (e) => {
          bool.value = true
          if (timerId.value) {
            clearTimeout(timerId.value)
            timerId.value = -1
          }
        })
  
        useEventListener(el as Ref<HTMLElement>, 'touchend', (e) => {
          timerId.value = window.setTimeout(() => {
            bool.value = false
          }, delayTime)
        })
      } else {
        (el as Ref<HTMLElement[]>).value.forEach((element, index) => {
          useEventListener(element, 'touchstart', (e) => {
            (bool as Ref<boolean[]>).value[index] = true
            if (timerId.value) {
              clearTimeout(timerId.value)
              timerId.value = -1
            }
          })
  
          useEventListener(element, 'touchend', (e) => {
            timerId.value = window.setTimeout(() => {
              (bool as Ref<boolean[]>).value[index] = false
            }, delayTime)
          })
        })
      }
    }
  }

  onMounted(() => {
    registerEvent()
  })
}

export default useTapTransition
