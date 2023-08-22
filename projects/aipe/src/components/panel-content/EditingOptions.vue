<template lang="pug">
div(class="w-full h-full")
  div(
    v-if="inSelectionMode"
    class="grid grid-rows-1 grid-cols-[auto,minmax(0,1fr)] items-center pl-24 pr-8 mb-16")
    span(class="typo-btn-sm text-app-text-secondary mr-12") {{ $t('NN0015') }}
    scrollable-container(:gap="20")
      nu-svg-icon(
        v-for="shape in shapeTypes"
        :key="shape"
        icon-color="primary-light-active"
        :icon-name="shape"
        icon-height="32px"
        :same-size="false")
  div(v-else class="px-24 mb-16") 
    props-slider(
      :title="`${$t('NN0001')}`"
      :borderTouchArea="true"
      :name="'brushSize'"
      :value="brushSize"
      :min="1"
      :max="300"
      @update="setBrushSize"
      @pointer-down="setIsChangingBrushSize(true)"
      @pointer-up="setIsChangingBrushSize(false)")
  div(class="w-full flex justify-between items-center px-24" ref="editorContainerRef")
    div(
      v-for="tab in featureTabs"
      class="flex flex-col items-center justify-center gap-6"
      @click="handleTabAction(tab)"
      ref="tabRefs")
      nu-svg-icon(
        :icon-color="tabColor(tab)"
        :icon-name="tab.icon"
        icon-height="24px")
      span(class="typo-body-sm transition-colors duration-300" :class="`text-${tabColor(tab)}`") {{ tab.text }}
</template>
<script setup lang="ts">
import useTapTransition from '@/composable/useTapTransition'
import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import type { ColorSlip } from '@/types/color'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
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
const editorStore = useEditorStore()
const { setEditorMode } = editorStore
const { editorMode } = storeToRefs(editorStore)

const canvasStore = useCanvasStore()
const { setCanvasStoreState } = canvasStore
const { brushSize } = storeToRefs(canvasStore)
const setBrushSize = (value: number) => {
  setCanvasStoreState({ brushSize: value })
}
const setIsChangingBrushSize = (value: boolean) => {
  setCanvasStoreState({ isChangingBrushSize: value })
}

const { t } = useI18n()
const shapeTypes = ['square', 'rectangle', 'circle', 'triangle', 'pentagon', 'hexagon']

// #region feature tab section
const tabRefs = ref<Array<HTMLElement | null>>([])

const selectedTab = computed(() => editorMode.value)

const inSelectionMode = computed(() => editorMode.value === 'selection')
const inCavnasDrawMode = computed(
  () => editorMode.value === 'erase' || editorMode.value === 'brush'
)

const featureTabs = reactive<Array<IFeatureTab>>([
  {
    icon: 'selection',
    text: t('NN0016')
  },
  {
    icon: 'brush',
    text: t('NN0017')
  },
  {
    icon: 'erase',
    text: t('NN0018')
  },
  {
    icon: 'reverse',
    text: t('NN0019'),
    pressed: false,
    disabled: true
  },
  {
    icon: 'move',
    text: t('NN0020'),
    disabled: true
  }
])

const tabColor = (tab: IFeatureTab): ColorSlip => {
  return tab.disabled
    ? 'app-tab-disable'
    : tab.icon === selectedTab.value
    ? 'app-tab-active'
    : 'app-tab-default'
}

const handleTabAction = (tab: IFeatureTab) => {
  /**
   * @param functionalTabs - means the tab will triger some function when click
   * instead of switching the state
   */
  switch (tab.icon) {
    case 'selection':
    case 'brush':
    case 'erase':
    case 'move': {
      setEditorMode(tab.icon)
      return
    }
    case 'reverse':
      break
    default:
      break
  }
}

watchEffect(() => {
  tabRefs.value.forEach((ref) => {
    featureTabs.forEach((tab) => {
      if (tab.pressed) {
        useTapTransition(ref, tab.pressed)
      }
    })
  })
})
// #endregion
</script>
<style lang="scss"></style>
