<template lang="pug">
component(:is="config.tag" v-bind="config.attrs" :style="config.style")
  custom-element(v-for="(subConfig, idx) in config.content"
                :config="subConfig" :key="idx")
  slot
</template>

<script lang="ts">
import { CustomElementConfig } from '@/interfaces/editor'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'CustomElement',
  props: {
    config: {
      type: Object as PropType<CustomElementConfig>,
      required: true
    }
  },
})
</script>

<style lang="scss" scoped>
</style>
