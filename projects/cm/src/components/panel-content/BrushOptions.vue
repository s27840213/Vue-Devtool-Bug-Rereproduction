<template lang="pug">
div(class="editing-options w-full flex flex-col items-center gap-16")
  slide-toggle(
    :options="modes"
    v-model="currMode"
    :bgColor="'black-3-5'"
    :switchColor="'white'"
    :activeColor="'black-2'"
    :inActiveColor="'white'"
    :optionWidth="'80px'"
    :optionHeight="'32px'"
    textSize="caption-SM")
  div(class="w-full box-border px-24")
    props-slider(
      :title="`${$t('NN0815')}`"
      :borderTouchArea="true"
      :name="'brushSize'"
      :value="brushSize"
      :min="1"
      :max="500"
      :showSizeNum="false"
      @update="setBrushSize"
      @pointer-down="setIsChangingBrushSize(true)"
      @pointer-up="setIsChangingBrushSize(false)")
  div(class="w-full flex-between-center box-border px-24")
    nubtn(
      theme="secondary"
      @click="cancel") {{ $t('NN0203') }}
    span(class="typo-h6 text-white") {{ $t('CM0017') }}
    nubtn(@click="apply") {{ $t('CM0061') }}
</template>
<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import type { PowerfulFillCanvasMode } from '@/types/editor'
import SlideToggle from '@nu/vivi-lib/components/global/SlideToggle.vue'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import PagePinchUtils from '@nu/vivi-lib/utils/pagePinchUtils'
import { storeToRefs } from 'pinia'

/**
 * @TODO - tidy up the codes
 */
interface IFeatureTab {
  icon: string
  text?: string
  hidden?: boolean
  pressed?: boolean
  disabled?: boolean
  forPro?: boolean
}

enum ControlMode {
  Clear = 'brush',
  Restore = 'erase',
  Move = 'move',
}

const { t } = useI18n()
const modes = [
  {
    label: t('CM0017'),
    value: ControlMode.Clear as string,
  },
  {
    label: t('CM0018'),
    value: ControlMode.Restore as string,
  },
  {
    label: t('CM0020'),
    value: ControlMode.Move as string,
  },
]

const currMode = ref<PowerfulFillCanvasMode>(ControlMode.Clear as PowerfulFillCanvasMode)
const canvasStore = useCanvasStore()
const { setCanvasStoreState } = canvasStore
const { brushSize, canvasMode } = storeToRefs(canvasStore)
const setBrushSize = (value: number) => {
  setCanvasStoreState({ brushSize: value })
}
const setIsChangingBrushSize = (value: boolean) => {
  setCanvasStoreState({ isChangingBrushSize: value })
}

watch(currMode, (newVal) => {
  setCanvasStoreState({
    canvasMode: newVal,
  })
})

const editorStore = useEditorStore()
const { setCurrActiveFeature } = editorStore

const cancel = () => {
  setCurrActiveFeature('none')
  groupUtils.deselect()
}


const apply = () => {
  setCurrActiveFeature('none')
  PagePinchUtils.resetPageScale()
  groupUtils.deselect()
}
</script>
<style lang="scss"></style>
