<template lang="pug">
div(class="control-point__action-icon")
  div(v-if="$isTouchDevice()" class="control-point__touch-area"
      @pointerdown.prevent.stop="pointerDown")
  div(class="control-point__action"
      :class="[theme, ...extraClasses]"
      :style="extraStyle"
      @pointerdown.prevent.stop="pointerDown"
      @touchstart="disableTouchEvent")
    svg-icon(class="control-point__action-svg" :iconName="iconName" :iconWidth="iconSize" :iconColor="iconColor")
</template>

<script setup lang="ts">
import type { IColorKeys } from '@/interfaces/color';
import generalUtils from '@/utils/generalUtils'
import pointerEvtUtils from '@/utils/pointerEvtUtils'
import type { PropType } from 'vue'

defineProps({
  iconName: {
    type: String,
    required: true,
  },
  iconSize: {
    type: String,
    default: () => '24px',
  },
  iconColor: {
    type: String as PropType<IColorKeys>,
    default: () => generalUtils.isPic ? 'blue-2' : 'black-1',
  },
  theme: {
    type: String as PropType<'border' | 'shadow'>,
    required: true,
  },
  extraClasses: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  extraStyle: {
    type: Object as PropType<{[key: string]: any}>,
    default: () => ({}),
  },
})

const emit = defineEmits<{(event: 'action', e: PointerEvent): void}>()

const pointerDown = (e: PointerEvent) => {
  pointerEvtUtils.addPointer(e)
  emit('action', e)
}
const disableTouchEvent = (e: TouchEvent) => {
  if (generalUtils.isTouchDevice()) {
    e.preventDefault()
    // e.stopPropagation()
  }
}
</script>
