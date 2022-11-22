<template lang="pug">
recycle-scroller(class="temp__content"
  :items="rows")
  template(v-slot="{ item }")
    div
      gallery-photo(v-for="(photo, i) in item.list"
        :style="imageStyle(photo.preview, i > 0)",
        :photo="photo"
        :key="photo.id")
      observer-sentinel(v-if="item.index === 2"
        target=".temp__content"
        @callback="handleLoadMore(item.page)")
  template(#after)
    div(class="text-center")
      svg-icon(v-if="pending"
        :iconName="'loading'"
        :iconColor="'white'"
        :iconWidth="'20px'")
</template>

<script lang="ts">
/**
 * This components is temporarily used for img section, and it will be remove in the future
 */
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'
import GalleryUtils from '@/utils/galleryUtils'
import GalleryPhoto from '@/components/GalleryPhoto.vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import generalUtils from '@/utils/generalUtils'

export default defineComponent({
  components: {
    ObserverSentinel,
    GalleryPhoto
  },
  computed: {
    ...mapState('photos', ['page', 'pending']),
    ...mapGetters('photos', [
      'getCurrentPagePhotos'
    ]),
    margin(): number {
      return this.galleryUtils.margin
    }
  },
  data() {
    return {
      rows: [],
      prevLastRow: [],
      galleryUtils: new GalleryUtils(generalUtils.isTouchDevice() ? window.innerWidth - 30 : 300, 95, 5)
    }
  },
  watch: {
    getCurrentPagePhotos(val) {
      const { prevLastRow } = this
      const rows = this.galleryUtils
        .generate(prevLastRow.concat(val))
        .map((row, idx) => ({
          list: row,
          id: `row${this.page}${idx}`,
          page: this.page,
          index: idx,
          size: row[0].preview.height + this.margin
        }))
      const lastRow = rows.splice(-1)[0]
      this.prevLastRow = (lastRow ? lastRow.list : []) as any
      this.rows = this.rows.concat(rows as any)
    }
  },
  methods: {
    imageStyle(attr: any, addMarginLeft: boolean) {
      return {
        width: `${attr.width}px`,
        height: `${attr.height}px`,
        marginLeft: `${addMarginLeft ? this.margin : 0}px`
      }
    },
    handleLoadMore(nextPage: number): void {
      if (nextPage === this.page) {
        this.$emit('loadMore')
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.temp {
  &__content {
    @include push-scrollbar10;
    @include hover-scrollbar();
    height: 100%;
    line-height: 0;
    text-align: left;
    box-sizing: border-box;
  }
}
</style>
