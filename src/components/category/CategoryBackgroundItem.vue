<template lang="pug">
  img(class="pointer"
    :src="src"
    draggable="false"
    @click="addBackground"
    @error="handleNotFound")
</template>

<script lang="ts">
import ImageUtils from '@/utils/imageUtils'
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  props: {
    src: String,
    objectId: String
  },
  components: {},
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      getJson: 'getJson'
    })
  },
  methods: {
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    addBackground(event: Event) {
      const { src } = event.target as HTMLImageElement
      const srcObj = {
        type: 'background',
        assetId: ImageUtils.getAssetId(src, 'background'),
        userId: ImageUtils.getUserId(src, 'background')
      }
      this.$store.commit(
        'SET_backgroundImageSrc',
        // { pageIndex: this.lastSelectedPageIndex, imageSrc: src.replace('prev', 'larg') }
        { pageIndex: this.lastSelectedPageIndex, srcObj }
      )
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
