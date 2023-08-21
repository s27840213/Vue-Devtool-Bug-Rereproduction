import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})

// export const useCounterStore = defineStore('counter', {
//   state: () => ({
//     count: 0,
//     name: 'counter'
//   }),
//   getters: {
//     doubleCount() {
//       this.count * 2
//     }
//   },
//   actions: {
//     increment() {
//       this.count++
//     }
//   }
// })
