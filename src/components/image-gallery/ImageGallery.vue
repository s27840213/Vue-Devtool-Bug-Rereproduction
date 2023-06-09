<template lang="pug">
recycle-scroller(class="image-gallery" id="recycle"
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
        :multiSelectMode="multiSelectMode"
        :key="photo.id")
  template(#after)
    slot(name="pending")
</template>

<script lang="ts">
import GalleryPhoto from '@/components/GalleryPhoto.vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import { IPhotoItem } from '@/interfaces/api'
import { GalleryImage } from '@/interfaces/gallery'
import GalleryUtils from '@/utils/galleryUtils'
import { defineComponent, PropType } from 'vue'

const component = defineComponent({
  props: {
    vendor: {
      type: String as PropType<'unsplash' | 'myfile'>,
      required: true
    },
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
    },
    multiSelectMode: {
      type: String as PropType<'hover' | 'on' | 'off'>,
      default: 'off'
    }
  },
  components: {
    ObserverSentinel,
    GalleryPhoto
  },
  emits: ['loadMore'],
  computed: {
    margin(): number {
      return this.galleryUtils.margin
    }
  },
  data() {
    return {
      nextIndex: 0,
      rows: [] as any[],
      galleryUtils: new GalleryUtils(this.$isTouchDevice() ? window.innerWidth - 34 : 300, 95, 5)
    }
  },
  watch: {
    myfile: {
      deep: true,
      handler: function() {
        this.myfileUpdate()
      },
    },
    images: { // For panel unsplash
      immediate: true,
      handler: function(newImages: GalleryImage[]) {
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
      },
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
export type CImageGallery = typeof component
export default component
</script>

<style lang="scss" scoped>
.image-gallery {
  @include push-scrollbar10;
  @include hover-scrollbar(dark);
  height: 100%;
  line-height: 0;
  text-align: left;
  box-sizing: border-box;
}
</style>
