<template lang="pug">
div(v-if="!$isCm" class="panel-position")
  div(v-for="(align,index) in alignDatas"
      :key="`popup-${index}`"
      class="panel-position__item"
      @click="align.action")
    svg-icon(
      class="pointer"
      :iconName="align.icon"
      iconWidth="18px"
      :iconColor="$isStk || $isCm ? 'white' : 'gray-1'")
    span(class="ml-5 body-2") {{ align.text }}
div(v-else class="panel-position")
  svg-icon(
    v-for="align in alignDatas"
    :key="align.icon"
    class="pointer"
    :iconName="align.icon"
    iconWidth="24px"
    :iconColor="$isStk || $isCm ? 'white' : 'gray-1'"
    @click="align.action")
</template>

<script lang="ts">
import mappingUtils from '@/utils/mappingUtils'
import { defineComponent } from 'vue'

export default defineComponent({
  computed: {
    alignDatas() {
      const texts = [
        this.$t('NN0046'),
        this.$t('NN0047'),
        this.$t('NN0048'),
        this.$t('NN0049'),
        this.$t('NN0050'),
        this.$t('NN0051'),
      ]
      return mappingUtils.mappingIconSet('align').map((icon, i) => ({
        icon,
        text: texts[i],
        action: () => mappingUtils.mappingIconAction(icon)
      }))
    }
  },
})
</script>

<style lang="scss" scoped>
.panel-position {
  width: 100%;
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: repeat(3, 1fr);
  row-gap: 16px;
  column-gap: 16px;
  padding-bottom: 16px;
  &__item {
    @include btn-action-mobile;
  }

  @include cm {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    background-color: setColor(app-tab-slider-bg-raw, 0.2);
    border-radius: 8px;
  };
}
</style>
