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
import { storeToRefs } from 'pinia'

const editorStore = useEditorStore()
const { setPageSize, setFirstPaintArea } = editorStore
const { imgAspectRatio, firstPaintArea, pageSize } = storeToRefs(editorStore)

const aspectRatioTypes = ['9_16', 'original', '16_9', '1_1', '2_3', '3_2', '4_5', '5_4']
const selectedType = ref('9_16')

const selectAspectRatio = (type: string) => {
  selectedType.value = type

  if (type === 'original') {
    setPageSize(1600 * imgAspectRatio.value, 1600)
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

  /**
   * @Note - width > height -> aspectRatio > 1
   * We have inner content and outer content
   * if inner content's aspectRatio > outer content's aspectRatio -> fit inner content's width
   * means the innter content and outer content's width are the same
   *
   * else fit inner content's height, and the inner content and outer content's height are the same
   *
   */
  let wDiff = 0
  let hDiff = 0
  if (imgAspectRatio.value > pageSize.value.width / pageSize.value.height) {
    const tmpW = pageSize.value.width
    const tmpH = tmpW / imgAspectRatio.value

    wDiff = pageSize.value.width - tmpW
    hDiff = pageSize.value.height - tmpH
    setFirstPaintArea(pageSize.value.width, hDiff / 2)
  } else {
    const tmpH = pageSize.value.height
    const tmpW = tmpH * imgAspectRatio.value
    wDiff = pageSize.value.width - tmpW
    hDiff = pageSize.value.height - tmpH
    setFirstPaintArea(wDiff / 2, pageSize.value.height)
  }
}

/**
 * Once the image was loaded
 * we need to trigger selectAspectRatio to make firstPaintArea work for default aspectRatio
 */
watch(imgAspectRatio, () => {
  selectAspectRatio(selectedType.value)
})
</script>
<style lang="scss"></style>
