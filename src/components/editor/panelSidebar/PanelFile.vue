<template lang="pug">
  div(class="panel-file"
      @drop.stop.prevent="onDrop($event)"
      @dragover.prevent,
      @dragenter.prevent)
    span(class="panel-file__title text-blue-1 label-lg") My File
    //- will remove in the furture
    span(class="panel-file__title text-blue-1 h-2") My Design Test
    div(class="tmp-mydesign")
      template(v-for="design in assetDesign")
        img(class="mr-5" :src="getPreviewSrc(design.id)" @click="setDesign(design)")
    btn(class="full-width mb-20"
      :type="'primary-mid'"
      @click.native="uploadImage()") Upload Image
    tmp-files(
      :inFilePanel="true")
    transition(name="panel-up")
      div(v-if="hasCheckedAssets"
          class="panel-file__menu")
        div
          svg-icon(class="pointer"
            :iconName="'folder'"
            :iconColor="'white'"
            :iconWidth="'24px'")
          svg-icon(class="pointer ml-10"
            :iconName="'trash'"
            :iconColor="'white'"
            :iconWidth="'24px'"
            @click.native="deleteAssets()")
        span(class="text-blue-1 pointer" @click="clearCheckedAssets()") {{`消取所有選取(${checkedAssets.length})`}}
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import uploadUtils from '@/utils/uploadUtils'
import GalleryUtils from '@/utils/galleryUtils'
import GalleryPhoto from '@/components/GalleryPhoto.vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import store from '@/store'
import { IUserDesignContentData } from '@/interfaces/api'
import designUtils from '@/utils/designUtils'

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
    ...mapGetters({
      checkedAssets: 'user/getCheckedAssets'
    }),
    margin(): number {
      return this.galleryUtils.margin
    },
    hasCheckedAssets(): boolean {
      return this.checkedAssets.length !== 0
    },
    assetDesign(): IUserDesignContentData {
      return (store.getters['user/getAssetDesign'] as IUserDesignContentData)
    }
  },
  methods: {
    ...mapActions({
      deleteAssets: 'user/deleteAssets'
    }),
    ...mapMutations({
      clearCheckedAssets: 'user/CLEAR_CHECKED_ASSETS'
    }),
    uploadImage() {
      uploadUtils.chooseAssets('image')
    },
    onDrop(evt: DragEvent) {
      const dt = evt.dataTransfer
      if (dt) {
        const files = dt.files
        uploadUtils.uploadAsset('image', files)
      }
    },
    getPreviewSrc(assetId: string) {
      return designUtils.getDesignPreview(assetId)
    },
    setDesign(design: IUserDesignContentData) {
      designUtils.setDesign(design)
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
  &__menu {
    display: flex;
    justify-content: space-between;
    align-content: center;
    box-sizing: border-box;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 20px 20px;
    background: setColor(nav);
    font-size: 14px;
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

.tmp-mydesign {
  overflow: scroll;
  display: flex;
  height: 100px;
  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
    background-color: unset;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 5px;
    background-color: #d9dbe1;
    border: 3px solid #2c2f43;
  }
}
</style>
