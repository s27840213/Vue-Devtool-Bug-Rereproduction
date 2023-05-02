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
      type: String as PropType<'default' | 'roundedRect'>,
      default: 'default',
    }
  },
  computed: {
    iconFileName() {
      switch (this.theme) {
        case 'roundedRect':
          return 'pro-rounded-rect.svg'
        default:
          return 'vivisticker_pro.svg'
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
  width: 24px;
  height: 24px;
  &.default {
    top: -1px; // (2px - 3px). The img contains spaces (3px in top and bottom, so to compensate the space, the top should be reduced by 3px)
    left: 2px;
  }
}
</style>
