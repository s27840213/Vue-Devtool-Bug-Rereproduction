<template lang="pug">
  div(v-if="config.shown" class="nu-highlighter" :style="styles()")
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
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  border: 3px solid setColor(blue-2);
  z-index: setZindex("nu-highlighter");
  box-sizing: border-box;
  &:hover {
    cursor: pointer;
  }
}
</style>
