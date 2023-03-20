<template lang="pug">
img(v-if="!inReviewMode" class="pro" loading="lazy"
    :src="require('@/assets/img/svg/pricing/pro.svg')" )
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
  position: absolute;
  top: 4px;
  left: 4px;
}
</style>
