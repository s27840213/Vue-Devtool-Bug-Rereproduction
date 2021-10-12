<template lang="pug">
  div(class="nu-image"
      :style="styles()"
      draggable="false")
    nu-adjust-image(v-if="isAdjustImage"
      :src="src"
      :styles="config.styles")
    img(v-else class="nu-image__picture" :src="src")
</template>

<script lang="ts">
import Vue from 'vue'
import NuAdjustImage from './NuAdjustImage.vue'
import ImageUtils from '@/utils/imageUtils'

export default Vue.extend({
  props: {
    config: Object
  },
  components: { NuAdjustImage },
  computed: {
    src(): string {
      if (this.config.src) {
        return this.config.src
      } else {
        return ImageUtils.getSrc(this.config)
      }
    },
    isAdjustImage(): boolean {
      const { styles } = this.config
      return Object
        .values(styles.adjust || {})
        .some(val => typeof val === 'number' && val !== 0)
    }
  },
  methods: {
    styles() {
      const { styles } = this.config
      return {
        transform: `translate(${styles.imgX}px, ${styles.imgY}px)`,
        width: `${styles.imgWidth}px`,
        height: `${styles.imgHeight}px`
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-image {
  position: absolute;
  top: 0px;
  left: 0px;
  &__picture {
    object-fit: cover;
    // object-fit: fill;
    width: 100%;
    height: 100%;
  }
}
</style>
