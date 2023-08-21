<template lang="pug">
div(class="w-full h-full")
  div(class="typo-btn-lg text-app-text-secondary") {{ $t('NN0013') }}
  div(class="scroll-container h-full overflow-scroll")
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
const aspectRatioTypes = ['9_16', 'original', '16_9', '1_1', '2_3', '3_2', '4_5', '5_4']
const selectedType = ref('9_16')

const selectAspectRatio = (type: string) => {
  selectedType.value = type
}
</script>
<style lang="scss">
.scroll-container {
  overflow: scroll;
  display: grid;
  grid-template-rows: auto;
  grid-auto-flow: column;
  column-gap: 12px;
  padding: 8px 12px;
}
</style>
