<template lang="pug">
  div(class="nu-layer")
    nu-clipper(v-if="config.type !== 'group'" :config="config")
      component(:is="`nu-${config.type}`" :config="config")
    component(v-else :is="`nu-${config.type}`" :config="config")
</template>

<script lang="ts">
import Vue from 'vue'
import { LayerType } from '@/store/types'

export default Vue.extend({
  props: {
    config: Object
  },
  data() {
    return {
      LayerType
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
