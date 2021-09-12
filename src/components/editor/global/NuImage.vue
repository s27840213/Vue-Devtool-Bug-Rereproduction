<template lang="pug">
  div(class="nu-image"
      :style="styles()"
      draggable="false")
    img(class="nu-image__picture" :src="src")
</template>

<script lang="ts">
import ImageUtils from '@/utils/imageUtils'
import Vue from 'vue'

export default Vue.extend({
  props: {
    config: Object
  },
  mounted() {
    console.log(this.config)
  },
  computed: {
    src(): string {
      if (this.config.src) {
        return this.config.src
      } else {
        return ImageUtils.getSrc(this.config)
      }
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
