<template lang="pug">
  img(class="pointer"
    :src="src"
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
    objectId: String
  },
  methods: {
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    addBackground() {
      AssetUtils.addBackground(this.objectId)
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
