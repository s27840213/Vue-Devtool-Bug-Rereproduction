<template lang="pug">
  div(class="image-gallery")
    recycle-scroller(class="image-gallery__content" id="recycle"
      :items="rows")
      template(v-slot="{ item }")
        observer-sentinel(v-if="item.sentinel"
          @callback="handleLoadMore(item)")
        div(class="flex flex-between")
          gallery-photo(v-for="photo in item.list"
            :style="imageStyle(photo.preview)"
            :photo="photo"
            :vendor="vendor"
            :inFilePanel="inFilePanel"
            :key="photo.id")
      template(#after)
        slot(name="pending")
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import GalleryUtils from '@/utils/galleryUtils'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import { IPhotoItem } from '@/interfaces/api'
import generalUtils from '@/utils/generalUtils'
import { mapState } from 'vuex'
import { GalleryImage } from '@/interfaces/gallery'

export default Vue.extend({
  props: {
    vendor: String,
    images: {
      type: Array as PropType<GalleryImage[]>,
      default: () => []
    },
    myfile: {
      type: Array as PropType<IPhotoItem[]>,
      default: () => []
    },
    inFilePanel: {
      type: Boolean,
      default: false
    }
  },
  components: {
    ObserverSentinel,
    /**
     * I'm not sure why I need to async import this component to prevent from the following errors:
     *  did you register the component correctly? For recursive components, make sure to provide the "name" option
     */
    GalleryPhoto: () => import('@/components/GalleryPhoto.vue')
  },
  computed: {
    ...mapState('file', ['regenerateGalleryFlag']),
    margin(): number {
      return this.galleryUtils.margin
    }
  },
  data() {
    return {
      nextIndex: 0,
      rows: [] as any[],
      galleryUtils: new GalleryUtils(generalUtils.isTouchDevice() ? window.innerWidth - 34 : 300, 95, 5)
    }
  },
  watch: {
    // For panel file
    regenerateGalleryFlag(newVal: boolean) {
      if (newVal) {
        this.myfileUpdate()
        this.galleryUtils.setRegenerateGalleryFlag(false)
      }
    },
    myfile() {
      this.myfileUpdate()
    },
    images(newImages: GalleryImage[]) { // For panel unsplash and pexel
      this.nextIndex = newImages.length
      this.rows = this.galleryUtils
        .generate(newImages)
        .map((row, idx) => ({
          list: row,
          id: `row_${idx}`,
          sentinel: false,
          size: row[0].preview.height + this.margin
        }))
      if (this.rows.length) {
        this.rows[Math.max(this.rows.length - 10, 0)].sentinel = true
      }
    }
  },
  methods: {
    myfileUpdate() {
      this.rows = this.galleryUtils
        .generate(this.myfile as any)
        .map((row, idx) => ({
          list: row,
          id: `row_${idx}`,
          sentinel: false,
          index: idx,
          size: row[0].preview.height + this.margin
        }))
      if (this.rows.length) {
        this.rows[Math.max(this.rows.length - 10, 0)].sentinel = true
      }
    },
    imageStyle(preview: any) {
      return {
        width: `${preview.width}px`,
        height: `${preview.height}px`
      }
    },
    handleLoadMore(item: any): void {
      item.sentinel = false
      this.$emit('loadMore')
    }
  }
})
</script>

<style lang="scss" scoped>
.image-gallery {
  overflow-x: visible;
  &__content {
    @include push-scrollbar10;
    @include hover-scrollbar($trackColor: setColor(sidebar-panel));
    height: 100%;
    line-height: 0;
    text-align: left;
    box-sizing: border-box;
  }
}
</style>
