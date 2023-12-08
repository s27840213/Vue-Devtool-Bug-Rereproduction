<template lang="pug">
div(class="flex flex-col items-center justify-center box-border px-24")
  div(class="text-app-tab-active typo-h4") {{ title }}
  div(class="text-app-text-secondary typo-btn-sm my-24 flex flex-col justify-center")
    span(v-html="content")
  div(class="flex justify-between w-full gap-24")
    nubtn(
      theme="secondary"
      size="mid-full"
      @click="cancel") {{ cancelText }}
    nubtn(
      size="mid-full"
      @click="confirm") {{ confirmText }}
</template>
<script setup lang="ts">
import { useModalStore } from '@/stores/modal'
const modalStore = useModalStore()
const { cancel, cancelText, confirm, confirmText, content, title } = toRefs(modalStore.modalInfo)
</script>
<style lang="scss"></style>
