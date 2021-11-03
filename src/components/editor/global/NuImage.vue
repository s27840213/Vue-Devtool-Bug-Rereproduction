<template lang="pug">
  div(class="nu-image"
      :style="styles()"
      draggable="false")
    nu-adjust-image(v-if="isAdjustImage"
      :src="src"
      :styles="config.styles")
    img(v-else class="nu-image__picture" :src="src")
</template>

<script lang="ts">
import Vue from 'vue'
import NuAdjustImage from './NuAdjustImage.vue'
import ImageUtils from '@/utils/imageUtils'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number
  },
  created() {
    const { type } = this.config.srcObj
    if (type === 'background') return

    fetch(ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, this.config.styles.width, 'pre')))
      .then(response => {
        if (response.status === 404 && this.config.srcObj.type === 'pexels') {
          ImageUtils.updateImgSrc(this.pageIndex, this.layerIndex,
            {
              userId: 'jpeg',
              ...this.config.srcObj
            })
        }
      })
      .then(() => {
        fetch(ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, this.config.styles.width, 'next')))
      })
  },
  data() {
    return {
      width: 0
    }
  },
  watch: {
    getImgWidth() {
      this.width = this.sizeMap(this.getImgWidth)
    },
    width() {
      const { type } = this.config.srcObj
      if (type === 'background') return
      fetch(ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, this.width, 'pre')))
      fetch(ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, this.width, 'next')))
    }
  },
  components: { NuAdjustImage },
  computed: {
    getImgWidth(): number {
      return this.config.styles.width
    },
    src(): string {
      if (this.config.src) {
        return this.config.src
      } else {
        return ImageUtils.getSrc(this.config)
      }
    },
    isAdjustImage(): boolean {
      const { styles } = this.config
      return Object
        .values(styles.adjust || {})
        .some(val => typeof val === 'number' && val !== 0)
    }
  },
  methods: {
    styles() {
      const { styles } = this.config
      return {
        transform: `translate(${styles.imgX}px, ${styles.imgY}px)`,
        width: `${styles.imgWidth}px`,
        height: `${styles.imgHeight}px`
      }
    },
    sizeMap(width: number) {
      if (width < 540) {
        return 540
      } else if (width < 800) {
        return 800
      } else if (width < 1080) {
        return 1080
      } else {
        return 1600
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-image {
  position: absolute;
  top: 0px;
  left: 0px;
  &__picture {
    object-fit: cover;
    // object-fit: fill;
    width: 100%;
    height: 100%;
  }
}
</style>
