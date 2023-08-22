<template lang="pug">
div(
  class="bg-app-bg px-24 py-8 flex justify-between items-center"
  :class="showPromptArea ? 'invisible pointer-events-none' : ''")
  div
    router-link(
      custom
      v-slot="{ navigate }"
      to="/")
      nu-svg-icon(
        icon-color="app-icon-light"
        icon-name="arrow-left"
        icon-width="24px"
        @click="navigate")
  div(class="text-primary-dark")
  div
    nu-btn(
      theme="primary"
      size="md"
      @click="handleNext") {{ $t('NN0012') }}
</template>
<script setup lang="ts">
import useStateInfo from '@/composable/useStateInfo'
import { useEditorStore } from '@/stores/editor'
import { storeToRefs } from 'pinia'
const editorStore = useEditorStore()
const { setEditorState } = editorStore
const { editorState } = storeToRefs(editorStore)
const { showPromptArea } = useStateInfo()

const handleNext = function () {
  if (editorState.value === 'aspectRatio') {
    setEditorState('editing')
  } else if (editorState.value === 'editing') {
    setEditorState('prompt')
  }
}
</script>
<style lang="scss"></style>
