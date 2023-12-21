<template lang="pug">
div(class="w-full flex-center gap-64 py-12 box-border")
  div(class="flex-center flex-col gap-4" @click="save")
    svg-icon(
      :iconName="'download'"
      :iconColor="'yellow-0'"
      :iconWidth="'24px'")
    span(class="text-yellow-0 typo-body-sm") {{ $t('STK0004') }}
  div(class="flex-center flex-col gap-4" @click="share")
    svg-icon(
      :iconName="'share'"
      :iconColor="'yellow-0'"
      :iconWidth="'24px'")
    span(class="text-yellow-0 typo-body-sm") {{ $t('NN0214') }}
  div(class="flex-center flex-col gap-4" @click="recreate")
    svg-icon(
      :iconName="'recreate'"
      :iconColor="'yellow-0'"
      :iconWidth="'24px'")
    span(class="text-yellow-0 typo-body-sm") {{ $t('CM0127') }}
  div(class="flex-center flex-col gap-4" @click="edit")
    svg-icon(
      :iconName="'pencil'"
      :iconColor="'yellow-0'"
      :iconWidth="'24px'")
    span(class="text-yellow-0 typo-body-sm") {{ $t('NN0504') }}
</template>
<script setup lang="ts">
import useActionSheetCm from '@/composable/useActionSheetCm'
import useStateInfo from '@/composable/useStateInfo'
import { useEditorStore } from '@/stores/editor'
import { useUserStore } from '@/stores/user'
import { notify } from '@kyvg/vue3-notification'

const userStore = useUserStore()
const { initWithSubDeisgnImage, initWithSubDesignConfig } = userStore
const { atEditor } = useStateInfo()
const { currOpenSubDesign } = storeToRefs(userStore)
const editorStore = useEditorStore()
const { changeToSpecificEditorState, keepEditingInit } = editorStore
const { editorType } = storeToRefs(editorStore)

const { setSavingActions, toggleActionSheet } = useActionSheetCm()
const save = () => {
  setSavingActions()
  toggleActionSheet()
}

const share = () => {
  notify({
    group: 'success',
    text: 'share',
  })
}

const recreate = () => {
  if (atEditor.value) {
    changeToSpecificEditorState(editorType.value, 'editing')
  } else {
    if (!currOpenSubDesign.value) return
    initWithSubDesignConfig(currOpenSubDesign.value)
  }
}

const edit = () => {
  if (atEditor.value) {
    keepEditingInit()
  } else {
    if (!currOpenSubDesign.value) return
    initWithSubDeisgnImage(currOpenSubDesign.value)
  }
}
</script>
<style lang="scss"></style>
