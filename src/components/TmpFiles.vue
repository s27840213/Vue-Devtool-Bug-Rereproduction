<template lang="pug">
  recycle-scroller(class="temp__content"
    :items="rows")
    template(v-slot="{ item }")
      div
        gallery-photo(v-for="(photo, i) in item.list"
          :style="imageStyle(photo.preview, i > 0)",
          :photo="photo"
          :key="photo.id"
          :inFilePanel="inFilePanel")
        observer-sentinel(v-if="item.index === 2"
          target=".temp__content"
          @callback="handleLoadMore(item.page)")
    template(#after)
      div(class="text-center")
        svg-icon(v-if="pending"
          :iconName="'loading'"
          :iconColor="'gray-2'"
          :iconWidth="'20px'")
</template>

<script lang="ts">
/**
 * This components is temporarily used for img section, and it will be remove in the future
 */
import Vue from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import GalleryUtils from '@/utils/galleryUtils'
import GalleryPhoto from '@/components/GalleryPhoto.vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import uploadUtils from '@/utils/uploadUtils'

export default Vue.extend({
  props: {
    inFilePanel: {
      type: Boolean,
      default: false
    }
  },
  components: {
    ObserverSentinel,
    GalleryPhoto
  },
  computed: {
    ...mapState('photos', ['page', 'pending']),
    ...mapGetters('photos', [
      'getCurrentPagePhotos'
    ]),
    ...mapGetters('user', [
      'getToken',
      'getUserAssets',
      'getDownloadUrl'
    ]),
    margin(): number {
      return this.galleryUtils.margin
    }
  },
  data() {
    return {
      rows: [],
      prevLastRow: [],
      galleryUtils: new GalleryUtils(300, 75, 5),
      photos: [
      ]
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
      this.prevLastRow = (rows.splice(-1)[0].list || []) as any
      this.rows = this.rows.concat(rows as any)
    },
    // temparaily used for handling user assets
    getUserAssets: {
      handler: function (newVal) {
        this.photos = newVal.image ? newVal.image.content.map((image: any) => {
          const aspectRatio = image.width / image.height
          const prevW = image.width > image.height ? image.width : 384 * aspectRatio
          const prevH = image.height > image.width ? image.height : 384 / aspectRatio
          return {
            width: image.width,
            height: image.height,
            preview: {
              width: prevW,
              height: prevH
            },
            urls: {
              prev: this.getDownloadUrl.replace('*', `asset/image/${image.id}/prev`),
              full: this.getDownloadUrl.replace('*', `asset/image/${image.id}/full`),
              larg: this.getDownloadUrl.replace('*', `asset/image/${image.id}/larg`),
              original: this.getDownloadUrl.replace('*', `asset/image/${image.id}/original`)
            }
          }
        }) : []

        if (this.photos.length > 0) {
          const rows = this.galleryUtils.generate(this.photos)
            .map((row, idx) => ({
              list: row,
              id: `row${idx}`,
              page: this.page,
              index: idx,
              size: row[0].preview.height + this.margin
            }))

          this.rows = rows as any
        }
      },
      deep: true
    }
  },
  mounted() {
    if (this.inFilePanel) {
      this._getAssets()
    }
  },
  methods: {
    ...mapActions({
      getAssets: 'user/getAssets'
    }),
    imageStyle(attr: any, addMarginLeft: boolean) {
      return {
        width: `${attr.width}px`,
        height: `${attr.height}px`,
        marginLeft: `${addMarginLeft ? this.margin : 0}px`
      }
    },
    handleLoadMore(nextPage: number): void {
      if (nextPage === this.page && !this.inFilePanel) {
        this.$emit('loadMore')
      }
    },
    async _getAssets() {
      await this.getAssets({ token: this.getToken })
    }
  }
})
</script>

<style lang="scss" scoped>
.temp {
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
      border: 3px solid #ffffff;
    }
    &:hover {
      &::-webkit-scrollbar-thumb {
        visibility: visible;
      }
    }
  }
}
</style>
