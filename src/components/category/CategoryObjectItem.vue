<template lang="pug">
  img(class="pointer"
    draggable="true"
    :src="src || `https://template.vivipic.com/svg/${item.id}/prev?ver=${item.ver}`"
    @dragstart="dragStart($event)"
    @click="addSvg")
</template>

<script lang="ts">
import Vue from 'vue'
import generalUtils from '@/utils/generalUtils'
import DragUtils from '@/utils/dragUtils'
import assetUtils, { RESIZE_RATIO_SVG } from '@/utils/assetUtils'

export default Vue.extend({
  props: {
    src: String,
    item: Object
  },
  methods: {
    dragStart(e: DragEvent) {
      const type = assetUtils.getLayerType(this.item.type)
      new DragUtils().itemDragStart(e, type || '', {
        ...this.item
      }, {
        resizeRatio: RESIZE_RATIO_SVG
      })
    },
    addSvg() {
      assetUtils.addAsset(this.item)
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
