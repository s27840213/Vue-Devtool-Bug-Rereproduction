<template lang="pug">
  img(class="pointer"
    :src="src"
    draggable="false"
    @click="addBackground"
    @error="handleNotFound")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { IImage } from '@/interfaces/layer'
import ImageUtils from '@/utils/imageUtils'
import GeneralUtils from '@/utils/generalUtils'
import LayerFactary from '@/utils/layerFactary'

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

      const el = document.createElement('img')
      el.src = ImageUtils.getSrc({ srcObj } as IImage)
      el.onload = () => {
        document.body.appendChild(el)
        let { width, height } = el.getBoundingClientRect()
        width /= 2
        height /= 2
        document.body.removeChild(el)
        const img: IImage = LayerFactary.newImage({
          styles: {
            width,
            height,
            x: 200,
            y: 200
          },
          srcObj
        })
        this.$store.commit('SET_backgroundImage', {
          pageIndex: this.lastSelectedPageIndex,
          config: img
        })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
