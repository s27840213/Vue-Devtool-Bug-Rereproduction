<template lang="pug">
div(class="flex-center flex-col box-border px-24")
  div(class="text-yellow-cm typo-h4") {{ title }}
  div(class="text-white typo-body-md my-24 flex flex-col justify-center")
    span(v-html="content")
  div(class="flex justify-between w-full gap-24")
    nubtn(
      theme="secondary"
      size="mid-full"
      @click="cancel")
      span(:style="cancelTextStyle") {{ cancelText }}
    nubtn(
      size="mid-full"
      @click="confirm")
      span(:style="confirmTextStyle") {{ confirmText }}
</template>
<script setup lang="ts">
import { useModalStore } from '@/stores/modal'
const modalStore = useModalStore()
const {
  cancel,
  cancelText,
  cancelTextStyle,
  confirm,
  confirmText,
  confirmTextStyle,
  content,
  title,
} = toRefs(modalStore.modalInfo)
</script>
<style lang="scss"></style>
