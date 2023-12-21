<template lang="pug">
div(class="editing-options w-full flex flex-col items-center gap-16")
  slide-toggle(
    :options="modes"
    v-model="currMode"
    :bgColor="'black-3-5'"
    :switchColor="'yellow-1'"
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
  footer-bar(
    class="w-full box-border px-24"
    :title="$t('CM0017')"
    @cancel="cancel"
    @apply="apply")
</template>
<script setup lang="ts">
import FooterBar from '@/components/panel-content/FooterBar.vue'
import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import type { PowerfulFillCanvasMode } from '@/types/editor'
import SlideToggle from '@nu/vivi-lib/components/global/SlideToggle.vue'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
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
const { setBrushSize, setIsChangingBrushSize, setCanvasMode } = canvasStore
const { brushSize, canvasMode } = storeToRefs(canvasStore)

watch(currMode, (newVal) => {
  setCanvasMode(newVal)
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

onMounted(async () => {
  const brushSize = await cmWVUtils.getState('brushSize')
  if (brushSize !== undefined) {
    setBrushSize(brushSize.brushSize)
  }
})
</script>
<style lang="scss"></style>
