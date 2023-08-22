<template lang="pug">
div(class="w-full h-full pl-24")
  div(class="typo-btn-lg text-app-text-secondary") {{ $t('NN0013') }}
  scrollable-container(:px="0")
    div(
      v-for="aspectRatio in aspectRatioTypes"
      :key="aspectRatio"
      :class="{ 'mr-12': aspectRatio === 'original' }"
      @click="selectAspectRatio(aspectRatio)")
      nu-svg-icon(
        :icon-color="selectedType === aspectRatio ? 'primary-light-active' : aspectRatio === 'original' ? 'app-text-secondary' : 'transparent'"
        :stroke-color="aspectRatio === 'original' ? undefined : selectedType === aspectRatio ? 'primary-light-active' : 'app-text-secondary'"
        :icon-width="aspectRatio === 'original' ? '40px' : '56px'"
        :icon-height="'56px'"
        :icon-name="aspectRatio")
      span(
        class="typo-btn-sm transition-colors duration-300"
        :class="selectedType === aspectRatio ? 'text-app-tab-active' : 'text-app-tab-default'") {{ aspectRatio }}
</template>
<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'

const editorStore = useEditorStore()
const { setPageSize, initAspectRatio } = editorStore

const aspectRatioTypes = ['9_16', 'original', '16_9', '1_1', '2_3', '3_2', '4_5', '5_4']
const selectedType = ref('9_16')

const selectAspectRatio = (type: string) => {
  selectedType.value = type

  if (type === 'original') {
    setPageSize(1600 * initAspectRatio, 1600)
  } else {
    const [w, h] = type.split('_')
    const width = parseInt(w)
    const height = parseInt(h)
    if (width > height) {
      setPageSize(1600, (1600 * height) / width)
    } else {
      setPageSize((1600 * width) / height, 1600)
    }
  }
}
</script>
<style lang="scss"></style>
