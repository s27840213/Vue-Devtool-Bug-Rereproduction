<template lang="pug">
div(class="flex-center flex-col box-border px-24 gap-16")
  div(class="text-yellow-cm typo-h4") {{ title }}
  div(class="text-white typo-body-md flex flex-col justify-center")
    span(v-html="content")
  slot(name="extra-content")
  div(class="flex justify-between w-full gap-24")
    nubtn(
      v-if="cancelText.length > 0"
      theme="secondary"
      size="mid-full"
      @click="cancel")
      span(:style="cancelTextStyle") {{ cancelText }}
    nubtn(
      v-if="confirmText.length > 0"
      size="mid-full"
      @click="confirm")
      span(:style="confirmTextStyle") {{ confirmText }}
</template>
<script setup lang="ts">
import type { INormalModal } from '@/stores/modal'
import { useModalStore } from '@/stores/modal'
const { modalInfo } = defineProps<{
  modalInfo: INormalModal
}>()

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
} = toRefs(modalInfo || modalStore.modalInfo)
</script>
<style lang="scss"></style>
