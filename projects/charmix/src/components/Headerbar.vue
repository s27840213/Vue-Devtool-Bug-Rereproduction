<template lang="pug">
div(
  class="bg-app-bg px-24 py-8 flex justify-between items-center"
  :class="showPromptArea ? 'invisible pointer-events-none' : ''")
  div
    back-btn
  div
  div
    nu-btn(
      theme="primary"
      size="md"
      @click="handleNextAction") {{ $t('CM0012') }}
</template>
<script setup lang="ts">
import useStateInfo from '@/composable/useStateInfo'
import { useEditorStore } from '@/stores/editor'
import { storeToRefs } from 'pinia'

const editorStore = useEditorStore()
const { setEditorState } = editorStore
const { editorState } = storeToRefs(editorStore)
const { showPromptArea } = useStateInfo()

const handleNextAction = function () {
  if (editorState.value === 'aspectRatio') {
    setEditorState('editing')
  } else if (editorState.value === 'editing') {
    setEditorState('prompt')
  }
}
</script>
<style lang="scss"></style>
