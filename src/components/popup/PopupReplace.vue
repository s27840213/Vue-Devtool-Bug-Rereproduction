<template lang="pug">
div(class="popup-window")
  div(class="panel-replace" v-click-outside="vcoConfig()"
      @dragover.prevent.stop="handleDragEnter"
      @dragenter.prevent.stop="handleDragEnter"
      @dragleave.prevent.stop="handleDragLeave"
      @drop.prevent.stop="handleDrop")
    div(class="panel-replace__top")
      tabs(:tabs="[$t('NN0006'), $tc('NN0002', 2)]"
          v-model="tableIndex" theme="light")
      nubtn(v-if="inMyfile" theme="primary" @click="handleUploadLogo") {{$t('NN0014')}}
      search-bar(v-else
          :clear="true"
          :defaultKeyword="keyword"
          :placeholder="$t('NN0092', {target: $tc('NN0002',1)})"
          @search="handleSearch")
    image-list(:images="data.images"
      :showMore="false"
      :showUploadArea="inMyfile"
      :loading="data.loading"
      @addImage="handleUploadLogo"
      @clickImage="clickImg"
      @loadMore="data.loadmore")
  drag-hover(v-if="isDraggedOver")
</template>

<script lang="ts">
import DragHover from '@/components/image-gallery/DragHover.vue'
import ImageList, { IImageListItem, spItem } from '@/components/image-gallery/ImageList.vue'
import SearchBar from '@/components/SearchBar.vue'
import Tabs from '@/components/Tabs.vue'
import { IAssetPhoto, IPhotoItem } from '@/interfaces/api'
import imageUtils from '@/utils/imageUtils'
import networkUtils from '@/utils/networkUtils'
import popupUtils from '@/utils/popupUtils'
import uploadUtils from '@/utils/uploadUtils'
import vClickOutside from 'click-outside-vue3'
import { defineComponent, PropType } from 'vue'
import { mapActions, mapState } from 'vuex'

interface IPopupReplaceItem extends IImageListItem {
  img?: IAssetPhoto | IPhotoItem
}

export default defineComponent({
  components: {
    Tabs,
    ImageList,
    DragHover,
    SearchBar,
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    replaceImg: {
      type: Function as PropType<(img: IAssetPhoto|IPhotoItem) => void>,
      required: true,
    }
  },
  data() {
    return {
      tableIndex: 0,
      isDraggedOver: false,
    }
  },
  computed: {
    ...mapState('file', {
      _myfileImages: 'myfileImages',
      myfileLoading: 'pending',
    }),
    ...mapState('unsplash', {
      _unsplashImages: 'content',
      searchResult: 'searchResult',
      unsplashLoading: 'pending',
      keyword: 'keyword'
    }),
    inMyfile() {
      return this.tableIndex === 0
    },
    myfileImages(): IPopupReplaceItem[] {
      return [
        ...(this._myfileImages as IAssetPhoto[]).map(img => ({
          type: '' as const,
          key: `${img.assetIndex}`,
          label: '',
          src: img.urls.tiny,
          uploading: img.urls.tiny.startsWith('data'),
          menuopen: false,
          img,
        })),
        ...this.myfileLoading ? [] : [spItem('sentinel')]
      ]
    },
    unsplashImages(): IPopupReplaceItem[] {
      const sizeMap = this.$store.state.user.imgSizeMap as Array<{ [key: string]: number | string }>
      const tinySize = sizeMap.find(e => e.key === 'tiny')?.size || 320
      return [
        ...((this.keyword ? this.searchResult : this._unsplashImages) as IPhotoItem[]).map((img, index) => {
          const data = {
            srcObj: { type: 'unsplash', userId: '', assetId: img.id }
          }
          return {
            type: '' as const,
            key: `${img.id}-${index}`,
            label: '',
            src: imageUtils.getSrc(data, tinySize),
            uploading: false,
            menuopen: false,
            img,
          }
        }),
        ...this.unsplashLoading ? [] : [spItem('sentinel')]
      ]
    },
    data() {
      return [{
        images: this.myfileImages,
        loading: this.myfileLoading,
        loadmore: this.loadmoreMyfile,
      }, {
        images: this.unsplashImages,
        loading: this.unsplashLoading,
        loadmore: this.loadmoreUnsplash,
      }][this.tableIndex]
    },
  },
  watch: {
    tabIndex(newVal) {
      if (newVal === 1) this.initUnsplash()
    },
  },
  methods: {
    ...mapActions({
      loadmoreMyfile: 'file/getMoreMyfiles',
      loadmoreUnsplash: 'unsplash/getMorePhotos',
      initUnsplash: 'unsplash/init',
      resetSearch: 'unsplash/resetSearch',
      getPhotos: 'unsplash/getPhotos',
    }),
    handleUploadLogo() {
      if (!this.inMyfile) return
      if (!networkUtils.check()) {
        networkUtils.notifyNetworkError()
      } else if (uploadUtils.isLogin) {
        uploadUtils.chooseAssets('image')
      }
    },
    clickImg(item: IPopupReplaceItem) {
      if (!item.img) return
      this.replaceImg(item.img)
      this.closePopup()
    },
    handleDragEnter() {
      if (!this.inMyfile) return
      this.isDraggedOver = true
    },
    handleDragLeave() {
      this.isDraggedOver = false
    },
    handleDrop(e: DragEvent) {
      this.isDraggedOver = false
      const files = e.dataTransfer?.files
      if (!this.inMyfile || !files) return
      uploadUtils.uploadAsset('image', files)
    },
    handleSearch(keyword?: string) {
      this.resetSearch()
      if (keyword) {
        this.getPhotos({ keyword })
      }
    },
    vcoConfig() {
      return {
        middleware: (e: MouseEvent) => {
          return (e.target as HTMLElement | null)?.id !== 'upload'
        },
        handler: this.closePopup
      }
    },
    closePopup() {
      popupUtils.closePopup()
    },
  }
})
</script>

<style lang="scss" scoped>
.panel-replace {
  display: grid;
  grid-template-rows: auto 1fr;
  width: 80vw;
  height: 80vh;
  padding: 20px 24px 0 24px;
  box-sizing: border-box;
  background-color: white;
  overflow: hidden auto;
  &__top {
    display: flex;
    justify-content: space-between;
    .tabs {
      width: 200px;
      margin-bottom: 26px;
    }
    .search-bar {
      width: 300px;
      height: 40px;
    }
  }
}
</style>
