<template lang="pug">
  img(class="pointer"
    :src="src || `https://template.vivipic.com/background/${item.id}/prev?ver=${item.ver}`"
    draggable="false"
    @click="addBackground"
    @error="handleNotFound")
</template>

<script lang="ts">
import Vue from 'vue'
import AssetUtils from '@/utils/assetUtils'

export default Vue.extend({
  props: {
    src: String,
    item: Object
  },
  methods: {
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    addBackground() {
      AssetUtils.addAsset(this.item)
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
