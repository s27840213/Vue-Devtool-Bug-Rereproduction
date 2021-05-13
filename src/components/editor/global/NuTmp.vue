<template lang="pug">
  div(class="nu-tmp"
      :style="styles()")
    nu-layer(v-for="(layer,index) in config.layers"
      :key="`layer-${index}`"
      :pageIndex="pageIndex"
      :config="layer"
      :style="{'outline': '2px solid #7190CC'}")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number
  },
  computed: {
    ...mapGetters({
      getLayer: 'getLayer'
    })
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
.nu-tmp {
  position: absolute;
  transform-style: preserve-3d;
}
</style>
