<template lang="pug">
div(class="w-full pl-24")
  div(class="typo-btn-lg text-app-text-secondary") {{ $t('CM0013') }}
  scrollable-container(:px="0")
    div(
      v-for="aspectRatio in aspectRatioTypes"
      :key="aspectRatio"
      class="w-56 flex flex-col justify-center items-center gap-4"
      @click="selectAspectRatio(aspectRatio)")
      cm-svg-icon(
        :iconColor="selectedType === aspectRatio ? 'primary-light-active' : aspectRatio === 'original' ? 'app-text-secondary' : 'transparent'"
        :strokeColor="aspectRatio === 'original' ? undefined : selectedType === aspectRatio ? 'app-tab-active' : 'app-text-secondary'"
        iconWidth="32px"
        iconHeight="32px"
        :iconName="aspectRatio")
      span(
        class="typo-btn-sm transition-colors duration-300 capitalize"
        :class="selectedType === aspectRatio ? 'text-app-tab-active' : 'text-app-tab-default'") {{ aspectRatio }}
</template>
<script setup lang="ts">
import { useEditorStore } from '@/stores/editor';
import layerUtils from '@nu/vivi-lib/utils/layerUtils';
import pageUtils from '@nu/vivi-lib/utils/pageUtils';
import { storeToRefs } from 'pinia';
const editorStore = useEditorStore()

const { imgAspectRatio } = storeToRefs(editorStore)

const aspectRatioTypes = ['9_16', 'original', '16_9', '1_1', '2_3', '3_2', '4_5', '5_4']
const selectedType = ref('9_16')

const selectAspectRatio = (type: string) => {
  selectedType.value = type

  if (type === 'original') {
    console.log(imgAspectRatio.value)
    if (imgAspectRatio.value > 1) {
      pageUtils.setPageSize(0, 1600, 1600 / imgAspectRatio.value)
    } else {
      pageUtils.setPageSize(0, 1600 * imgAspectRatio.value, 1600)
    }
  } else {
    const [w, h] = type.split('_')
    const width = parseInt(w)
    const height = parseInt(h)

    if (width > height) {
      pageUtils.setPageSize(0, 1600, (1600 * height) / width)
      layerUtils.updateLayerStyles(0, 0, {})
    } else {
      pageUtils.setPageSize(0, (1600 * width) / height, 1600)
    }
  }

  layerUtils.resizeLayerConfig(0, layerUtils.getCurrLayer, true)

  /**
   * @Note - width > height -> aspectRatio > 1
   * We have inner content and outer content
   * if inner content's aspectRatio > outer content's aspectRatio -> fit inner content's width
   * means the innter content and outer content's width are the same
   *
   * else fit inner content's height, and the inner content and outer content's height are the same
   *
   */
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
