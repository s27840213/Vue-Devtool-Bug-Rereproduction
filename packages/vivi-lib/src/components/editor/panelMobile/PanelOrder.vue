<template lang="pug">
div(v-if="!$isCm" class="panel-order")
  div(v-for="(data,index) in orderDatas"
      :key="`popup-${index}`"
      class="panel-order__item"
      @click="data.action && data.action()")
    svg-icon(
      class="pointer"
      :iconName="data.icon"
      :iconWidth="'16px'"
      :iconColor="$isStk || $isCm ? 'white' : 'gray-1'")
    span(class="ml-5 body-2") {{data.text}}
div(v-else class="panel-order")
  div(
    v-for="order in orderDatas"
    :key="order.icon"
    class="grid gap-4 justify-center justify-items-center no-wrap"
    @click="order.action")
    svg-icon(
      class="pointer"
      :iconName="order.icon + '-cm'"
      iconWidth="24px"
      :iconColor="$isStk || $isCm ? 'white' : 'gray-1'")
    span(class="text-white") {{ order.text }}
</template>

<script lang="ts">
import MappingUtils from '@/utils/mappingUtils'
import { defineComponent } from 'vue'

export default defineComponent({
  computed: {
    orderDatas() {
      const orderSet = [
        {
          icon: 'layers-forward',
          text: this.$tc('NN0232', this.$isCm ? 2 : 1)
        },
        {
          icon: 'layers-front',
          text: this.$tc('NN0231', this.$isCm ? 2 : 1)
        },
        {
          icon: 'layers-backward',
          text: this.$tc('NN0233', this.$isCm ? 2 : 1)
        },
        {
          icon: 'layers-back',
          text: this.$tc('NN0234', this.$isCm ? 2 : 1)
        }]
      if (this.$isCm) {
        [orderSet[1], orderSet[2]] = [orderSet[2], orderSet[1]]
      }
      return orderSet.map((data) => {
        return {
          icon: data.icon,
          text: data.text,
          action: MappingUtils.mappingIconAction(data.icon)
        }
      })
    },
  },
})
</script>

<style lang="scss" scoped>
.panel-order {
  width: 100%;
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 16px;
  row-gap: 16px;
  padding-bottom: 16px;
  &__item {
    @include btn-action-mobile;
  }

  @include cm {
    @apply typo-body-sm;
    display: grid;
    grid-template-columns: repeat(4, 44px);
    grid-template-rows: initial;
    justify-content: space-between;
    padding: 8px;
    background-color: setColor(app-tab-slider-bg-raw, 0.2);
    border-radius: 8px;
  };
}
</style>
