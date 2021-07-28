<template lang="pug">
  div(class="nu-image"
      :style="styles()"
      draggable="false")
    img(class="nu-image__picture" :src="config.src")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    config: Object
  },
  methods: {
    styles() {
      const styles = this.config.styles
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
    object-fit: fill;
    width: 100%;
    height: 100%;
  }
}
</style>
