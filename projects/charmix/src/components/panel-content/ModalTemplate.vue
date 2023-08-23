<template lang="pug">
div(class="flex flex-col items-center justify-center px-24")
  div(class="text-app-tab-active typo-h4") {{ title }}
  div(class="text-app-text-secondary typo-btn-sm my-24 flex flex-col justify-center")
    span(v-for="line in multilineContent") {{ line }}
  div(class="flex justify-between w-full gap-24")
    nu-btn(
      theme="secondary"
      :full="true"
      @click="confirm") {{ confirmText }}
    nu-btn(
      theme="primary"
      :full="true"
      @click="cancel") {{ cancelText }}
</template>
<script setup lang="ts">
import { useModalStore } from '@/stores/modal'
const modalStore = useModalStore()
const { cancel, cancelText, confirm, confirmText, content, title } = toRefs(modalStore.modalInfo)

const multilineContent = computed(() => {
  return content.value.split('\n')
})
</script>
<style lang="scss"></style>
