<template lang="pug">
  div(class="nu-group"
      :style="styles()")
    nu-layer(v-for="(layer,index) in config.layers"
      :key="`layer-${index}`"
      :pageIndex="pageIndex"
      :config="layer")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number
  },
  mounted() {
    console.log('group created')
    console.log()
    console.log(this.config.layers)
  },
  methods: {
    styles() {
      return {
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-group {
  position: relative;
}
</style>
