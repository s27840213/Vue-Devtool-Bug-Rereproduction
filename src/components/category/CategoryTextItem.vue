<template lang="pug">
  img(class="pointer"
    :src="src || fallbackSrc || `https://template.vivipic.com/text/${item.id}/prev?ver=${item.ver}`"
    style="object-fit: contain;"
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
    addText() {
      // AssetUtils.addAsset(this.item)
      //   .then(() => {
      //     textPropUtils.updateTextPropsState()
      //   })
      console.log('start editing', this.item)
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
