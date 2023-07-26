<template lang="pug">
img(:class="`pro ${theme}`" loading="lazy"
    :src="require(`@/assets/img/svg/pricing/${iconFileName}`)" )
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  emits: [],
  name: 'ProItem',
  props: {
    theme: {
      type: String as PropType<'default' | 'roundedRect' | 'vivisticker' | 'top-right-corner'>,
      default: 'vivisticker',
    }
  },
  computed: {
    iconFileName() {
      switch (this.theme) {
        case 'roundedRect':
          return 'pro-rounded-rect.svg'
        case 'vivisticker':
        case 'top-right-corner':
          return 'vivisticker_pro.svg'
        default:
          return 'pro.svg'
      }
    },
    // inReviewMode(): boolean {
    //   // return webViewUtils.inReviewMode
    //   return true // Vivisticker hide all pro-items
    // },
  },
})
</script>

<style lang="scss" scoped>
.pro {
  position: absolute;
  top: 4px;
  left: 4px;
  &.default {
    width: 24px;
    height: 24px;
  }
  &.vivisticker {
    width: 24px;
    height: 24px;
    top: -1px; // (2px - 3px). The img contains spaces (3px in top and bottom, so to compensate the space, the top should be reduced by 3px)
    left: 2px;
  }
  &.top-right-corner {
    width: 24px;
    height: 24px;
    top: -1px;
    right: 2px;
    left: unset;
  }
  &.roundedRect {
    width: 22px;
    height: 12px;
  }
}
</style>
