<template lang="pug">
img(v-if="!inReviewMode" :class="`pro ${theme}`" loading="lazy"
    :src="require(`@/assets/img/svg/pricing/${iconFileName}`)" )
</template>

<script lang="ts">
import webViewUtils from '@/utils/picWVUtils'
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
          return 'pro.svg'
      }
    },
    inReviewMode(): boolean {
      return webViewUtils.inReviewMode
    },
  },
})
</script>

<style lang="scss" scoped>
.pro {
  position: absolute;
  &.default {
    top: 4px;
    left: 4px;
  }
}
</style>
