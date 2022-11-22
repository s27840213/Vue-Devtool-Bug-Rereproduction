<template lang="pug">
img(class="pointer"
  ref="img"
  :src="src || fallbackSrc || imageUtils.getSrc({ srcObj: { type: 'background', assetId: item.id, userId: '' }}, 'prev', item.ver)"
  draggable="false"
  @click="addBackground"
  @click.right.prevent="openUpdateDesignPopup()"
  @error="handleNotFound")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import store from '@/store'
import { mapGetters } from 'vuex'
import AssetUtils from '@/utils/assetUtils'
import imageUtils from '@/utils/imageUtils'

export default defineComponent({
  props: {
    src: String,
    item: Object,
    locked: Boolean
  },
  data() {
    return {
      fallbackSrc: '',
      imageUtils
    }
  },
  computed: {
    ...mapGetters('user', {
      isAdmin: 'isAdmin'
    })
  },
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    addBackground() {
      if (this.locked) {
        return this.$notify({ group: 'copy', text: '🔒背景已被鎖定，請解鎖後再進行操作' })
      }
      const img = this.$refs.img as HTMLImageElement
      if (!img) {
        console.error('img in background category is null')
        return
      }
      const panelPreviewSrc = img.src
      const imgSrcSize = {
        width: img.naturalWidth,
        height: img.naturalHeight
      }
      AssetUtils.addAsset(this.item, { panelPreviewSrc, imgSrcSize })
    },
    openUpdateDesignPopup() {
      if (this.isAdmin) {
        const isUpdateDesignOpen = true
        const updateDesignId = this.item.id
        const updateDesignType = 'background'
        store.commit('user/SET_STATE', { isUpdateDesignOpen, updateDesignId, updateDesignType })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
