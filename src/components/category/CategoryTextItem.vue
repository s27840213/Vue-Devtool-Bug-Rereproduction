<template lang="pug">
  img(class="pointer"
    :src="src || fallbackSrc || `https://template.vivipic.com/text/${item.id}/prev?ver=${item.ver}`"
    draggable="true"
    style="object-fit: contain;"
    @dragstart="dragStart($event)"
    @click="addText"
    @error="handleNotFound")
</template>

<script lang="ts">
import Vue from 'vue'
import AssetUtils from '@/utils/assetUtils'
import textPropUtils from '@/utils/textPropUtils'
import DragUtils from '@/utils/dragUtils'

export default Vue.extend({
  props: {
    src: String,
    item: Object
  },
  created() {
    this.item.db = 'text'
  },
  data() {
    return {
      fallbackSrc: ''
    }
  },
  components: {},
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    dragStart(e: DragEvent) {
      new DragUtils().itemDragStart(e, 'group', {
        ...this.item
      })
    },
    addText() {
      AssetUtils.addAsset(this.item)
        .then(() => {
          textPropUtils.updateTextPropsState()
        })
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
