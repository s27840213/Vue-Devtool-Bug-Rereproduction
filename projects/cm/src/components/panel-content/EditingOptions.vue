<template lang="pug">
div(class="editing-options w-full")
  div(class="mb-16 px-24") 
    props-slider(
      :title="`${$t('CM0001')}`"
      :borderTouchArea="true"
      :name="'brushSize'"
      :value="brushSize"
      :min="1"
      :max="500"
      @update="setBrushSize"
      @pointer-down="setIsChangingBrushSize(true)"
      @pointer-up="setIsChangingBrushSize(false)")
  div(class="w-full flex justify-between items-center px-24" ref="editorContainerRef")
    div(
      v-for="tab in featureTabs"
      :key="tab.icon"
      class="flex flex-col items-center justify-center gap-6"
      @click="handleTabAction(tab)"
      ref="tabRefs")
      cm-svg-icon(
        :icon-color="tabColor(tab)"
        :icon-name="tab.icon"
        icon-height="24px")
      span(class="typo-body-sm transition-colors duration-300" :class="`text-${tabColor(tab)}`") {{ tab.text }}
</template>
<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas'
import type { ColorSlip } from '@/types/color'
import useTapTransition from '@nu/vivi-lib/composable/useTapTransition'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
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
const canvasStore = useCanvasStore()
const { setCanvasStoreState } = canvasStore
const { brushSize, canvasMode } = storeToRefs(canvasStore)
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

const selectedTab = computed(() => canvasMode.value)

const inCavnasDrawMode = computed(
  () => canvasMode.value === 'erase' || canvasMode.value === 'brush',
)

const featureTabs = reactive<Array<IFeatureTab>>([
  {
    icon: 'brush',
    text: t('CM0017'),
  },
  {
    icon: 'erase',
    text: t('CM0018'),
  },
  {
    icon: 'reverse',
    text: t('CM0019'),
    pressed: false,
  },
  {
    icon: 'move',
    text: t('CM0020'),
    disabled: true,
  },
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
  if (tab.disabled) return
  switch (tab.icon) {
    case 'brush':
    case 'erase':
    case 'move': {
      setCanvasStoreState({
        canvasMode: tab.icon,
      })
      break
    }
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
