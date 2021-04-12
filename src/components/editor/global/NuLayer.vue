<template lang="pug">
  div(class="nu-layer"
  :style="styles()")
    nu-clipper(v-if="config.type !== 'group'" :config="config")
      component(:is="`nu-${config.type}`" :config="config")
    // component(v-else :is="`nu-${config.type}`" :config="config")
    nu-layer(
      v-else
      v-for="(layer, index) in config.layers",
      :key="`layer-${index}`",
      :config="layer",
    )
</template>

<script lang="ts">
import Vue from 'vue'
import { LayerType } from '@/store/types'

export default Vue.extend({
  props: {
    config: Object
  },
  mounted() {
  },
  data() {
    return {
      LayerType
    };
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
});
</script>

<style lang="scss" scoped>
.nu-layer {
  position: absolute;
  box-shadow:inset 0px 0px 0px 7px rgba(136, 136, 136, 0.5);
  width: 100px;
  height: 100px;
  background-color: white;

  &:active {
    background-color: rgba(168, 218, 220, 1);
  }
  &:hover {
    cursor:pointer;
  }
}
</style>
