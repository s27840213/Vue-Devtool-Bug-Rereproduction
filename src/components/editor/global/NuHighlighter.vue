<template lang="pug">
  div(class="nu-highlighter" :style="styles()" )
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    config: Object
  },
  data() {
    return {
    }
  },
  methods: {
    styles() {
      return {
        transform: `translate(${this.config.styles.x}px, ${this.config.styles.y}px)`,
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-highlighter {
  // @include size(100px, 100px);
  // border: 1px solid setColor(blue-1);
  position: absolute;
  background-color: rgb(216, 236, 143);

  &:hover {
    cursor: pointer;
  }
}
</style>
