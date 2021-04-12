<template lang="pug">
  div(class="nu-layer" :style="styles()")
    nu-clipper(v-if="config.type !== 'group'" :config="config")
      component(:is="`nu-${config.type}`" :config="config")
    component(v-else :is="`nu-${config.type}`" :config="config")
</template>

<script lang="ts">
import Vue from 'vue'
import { LayerType } from '@/store/types'
import { convertDefaultStyle } from '@/utils/converter'

export default Vue.extend({
  props: {
    config: Object
  },
  data() {
    return {
      LayerType
    }
  },
  methods: {
    styles() {
      return convertDefaultStyle(this.config.styles)
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
}
</style>
