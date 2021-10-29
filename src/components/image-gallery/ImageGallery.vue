<template lang="pug">
  div(class="image-gallery")
    recycle-scroller(class="image-gallery__content"
      :items="rows")
      template(v-slot="{ item }")
        observer-sentinel(v-if="item.sentinel"
          target=".image-gallery__content"
          @callback="handleLoadMore(item)")
        div(class="flex flex-between")
          gallery-photo(v-for="photo in item.list"
            :style="imageStyle(photo.preview)"
            :photo="photo"
            :vendor="vendor"
            :key="photo.id")
      template(#after)
        slot(name="pending")
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import GalleryUtils from '@/utils/galleryUtils'
import GalleryPhoto from '@/components/GalleryPhoto.vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import { IPhotoItem } from '@/interfaces/api'

export default Vue.extend({
  props: {
    vendor: String,
    images: {
      type: Array as PropType<Array<IPhotoItem[]>>,
      default: () => []
    }
  },
  components: {
    ObserverSentinel,
    GalleryPhoto
  },
  computed: {
    margin(): number {
      return this.galleryUtils.margin
    }
  },
  data() {
    return {
      nextIndex: 0,
      rows: [] as any[],
      prevLastRow: [],
      galleryUtils: new GalleryUtils(300, 95, 5)
    }
  },
  watch: {
    images(newImages: Array<IPhotoItem[]>) {
      const { nextIndex, prevLastRow } = this
      const latestImages = newImages.slice(nextIndex)
      this.nextIndex = newImages.length
      const rows = this.galleryUtils
        .generate(prevLastRow.concat(latestImages as any))
        .map((row, idx) => ({
          list: row,
          id: `row_${nextIndex}_${idx}`,
          sentinel: false,
          size: row[0].preview.height + this.margin
        }))
      if (rows.length > 1) {
        const lastRow = rows.splice(-1)[0]
        this.prevLastRow = (lastRow ? lastRow.list : []) as any
      } else {
        this.prevLastRow = []
      }
      if (rows.length) {
        rows[0].sentinel = true
        this.rows = this.rows.concat(rows as any)
      }
    }
  },
  methods: {
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
  &__content {
    height: 100%;
    line-height: 0;
    text-align: left;
    box-sizing: border-box;
    margin-right: -10px;
    overflow-y: scroll;
    scrollbar-width: thin;
    overscroll-behavior: contain;
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
      background-color: unset;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 5px;
      visibility: hidden;
      background-color: #d9dbe1;
      border: 3px solid #2c2f43;
    }
    &:hover {
      &::-webkit-scrollbar-thumb {
        visibility: visible;
      }
    }
  }
}
</style>
