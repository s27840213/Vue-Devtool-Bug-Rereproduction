<template lang="pug">
modal-template(:modalInfo="modalInfo")
  template(#extra-content)
    div(
      v-if="forBrushChangeWarning"
      class="w-full grid grid-cols-[4fr,3fr,4fr] grid-rows-1 gap-12 overflow-hidden")
      div
        img(class="w-full object-contain" :src="require('brush-change-mask.png')")
      div(class="flex-center flex-col gap-8 w-full h-full")
        img(class="w-full object-contain" :src="require('prompt-demo.png')")
        svg-icon(
          iconName="arrow-long"
          :sameSize="false"
          iconWidth="72"
          iconColor="yellow-0")
      div
        img(class="w-full object-contain" :src="require('brush-change-done.png')")
</template>
<script setup lang="ts">
/**
 * I want to make ModalTemplate.vue as pure as possible
 * maybe it will be moved to a common component library in the future.
 */
import { useModalStore } from '@/stores/modal'

const modalStore = useModalStore()
const { modalInfo } = storeToRefs(modalStore)
const extraContentType = computed(() => {
  return modalInfo.value.extraContentType
})

const forBrushChangeWarning = computed(() => {
  return extraContentType.value === 'brush-change'
})
</script>
<style lang="scss"></style>
