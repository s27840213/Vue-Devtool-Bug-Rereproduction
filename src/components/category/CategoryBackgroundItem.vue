<template lang="pug">
  img(class="pointer"
    :src="src || fallbackSrc || `https://template.vivipic.com/background/${item.id}/prev?ver=${item.ver}`"
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
  data() {
    return {
      fallbackSrc: ''
    }
  },
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    addBackground() {
      AssetUtils.addAsset(this.item)
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
