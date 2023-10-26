<template lang="pug">
img(v-if="!inReviewMode"
    :class="`pro ${theme}`"
    loading="lazy"
    draggable="false"
    :src="requireSrc(`svg/pricing/${iconFileName}`)")
</template>

<script lang="ts">
import generalUtils from '@/utils/generalUtils'
import imageUtils from '@/utils/imageUtils'
import picWVUtils from '@/utils/picWVUtils'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  emits: [],
  name: 'ProItem',
  props: {
    theme: {
      type: String as PropType<'default' | 'roundedRect' | 'vivisticker' | 'top-right-corner'>,
      default: generalUtils.isStk ? 'vivisticker' : 'default',
    }
  },
  computed: {
    iconFileName() {
      switch (this.theme) {
        case 'roundedRect':
          return 'pro-rounded-rect.svg'
        case 'vivisticker':
        case 'top-right-corner':
          return 'pro_vivisticker.svg'
        default:
          return 'pro.svg'
      }
    },
    inReviewMode(): boolean {
      return picWVUtils.inReviewMode
    },
  },
  methods:{
    requireSrc(src: string): string {
      return imageUtils.requireSrc(src)
    },
  }
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
