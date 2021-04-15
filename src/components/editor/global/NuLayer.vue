<template lang="pug">
  div(class="nu-layer" :style="styles()")
    nu-clipper(v-if="config.type !== 'group'" :config="config")
      component(:is="`nu-${config.type}`" :config="config")
    component(v-else :is="`nu-${config.type}`" :config="config")
</template>

<script lang="ts">
import Vue from 'vue'
import { LayerType } from '@/store/types'
import CssConveter from '@/utils/cssConverter'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number
  },
  data() {
    return {
      LayerType
    }
  },
  methods: {
    styles() {
      return CssConveter.convertDefaultStyle(this.config.styles)
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-layer {
  position: absolute;
  top: 0;
  left: 0;
  display: inline-block;
  box-shadow: inset 0px 0px 0px 7px rgba(136, 136, 136, 0.5);
  width: 100px;
  height: 100px;
  background-color: white;

  &:focus {
    background-color: rgba(168, 218, 220, 1);
  }
  &:hover {
    cursor: pointer;
  }
}
</style>
