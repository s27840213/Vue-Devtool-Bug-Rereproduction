<template lang="pug">
img(class="pro" loading="lazy"
    :src="require('@/assets/img/svg/pricing/vivisticker_pro.svg')" )
</template>

<script lang="ts">
import webViewUtils from '@/utils/picWVUtils'
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
  name: 'ProItem',
  computed: {
    inReviewMode(): boolean {
      return webViewUtils.inReviewMode
    },
  },
})
</script>

<style lang="scss" scoped>
.pro {
  width: 24px;
  height: 24px;
  position: absolute;
  top: -1px; // (2px - 3px). The img contains spaces (3px in top and bottom, so to compensate the space, the top should be reduced by 3px)
  left: 2px;
}
</style>
