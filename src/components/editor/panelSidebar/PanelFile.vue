<template lang="pug">
  div(class="panel-file"
      @drop.stop.prevent="onDrop($event)"
      @dragover.prevent,
      @dragenter.prevent)
    span(class="panel-file__title text-blue-1 label-lg") My File
    btn(class="full-width mb-20"
      :type="'primary-mid'"
      @click.native="uploadImage()") Upload Image
    tmp-files(
      :inFilePanel="true")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import uploadUtils from '@/utils/uploadUtils'
import GalleryUtils from '@/utils/galleryUtils'
import GalleryPhoto from '@/components/GalleryPhoto.vue'

export default Vue.extend({
  components: {
    SearchBar,
    GalleryPhoto
  },
  data() {
    return {
      galleryUtils: new GalleryUtils(300, 75, 5)
    }
  },
  computed: {
    margin(): number {
      return this.galleryUtils.margin
    }
  },
  methods: {
    uploadImage() {
      uploadUtils.uploadAsset()
    },
    onDrop(evt: DragEvent) {
      const dt = evt.dataTransfer
      if (dt) {
        const files = dt.files
        uploadUtils.uploadImageAsset(files)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-file {
  @include size(100%, 100%);
  display: grid;
  grid-template-rows: auto auto 1fr;
  grid-template-columns: 1fr;
  text-align: center;
  &__title {
    margin-bottom: 20px;
  }
}

.tmp-gallery {
  height: 100%;
  line-height: 0;
  text-align: left;
  box-sizing: border-box;
  overflow-y: scroll;
  overscroll-behavior: contain;
  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
