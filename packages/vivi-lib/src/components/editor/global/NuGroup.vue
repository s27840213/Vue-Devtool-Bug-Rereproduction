<template lang="pug">
div(class="nu-group")
  nu-layer(v-for="(layer,index) in config.layers"
    :key="`layer-${layer.id}`"
    :pageIndex="pageIndex"
    :page="page"
    :primaryLayer="config"
    :layerIndex="layerIndex"
    :subLayerIndex="index"
    :contentScaleRatio="contentScaleRatio"
    :config="layer"
    :isSubLayer="true"
    :inPreview="inPreview")
</template>

<script lang="ts">
import { IPage } from '@/interfaces/page'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  emits: [],
  props: {
    config: {
      type: Object,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
    },
    page: {
      type: Object as PropType<IPage>,
      required: true
    },
    layerIndex: {
      type: Number,
      required: true
    },
    contentScaleRatio: {
      default: 1,
      type: Number
    },
    inPreview: {
      default: false,
      type: Boolean
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-group {
  position: absolute;
  transform-style: flat;
  transform-origin: top left;
}
</style>
