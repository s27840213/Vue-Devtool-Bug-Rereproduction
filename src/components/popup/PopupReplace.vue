<template lang="pug">
div(class="popup-window")
  div(class="panel-replace" v-click-outside="closePopup")
    tabs(:tabs="[$t('NN0006'), $tc('NN0002', 2)]"
        v-model="tableIndex" theme="light")
    image-list(:images="data.images"
      :showMore="false"
      @addImage="handleUploadLogo"
      @clickImage="clickImg"
      @loadMore="data.loadmore")
</template>

<script lang="ts">
import ImageList, { IImageListItem, spItem } from '@/components/image-gallery/ImageList.vue'
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
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    selectImg: {
      type: Function as PropType<(img: IAssetPhoto|IPhotoItem) => void>,
      required: true,
    }
  },
  data() {
    return {
      tableIndex: 0
    }
  },
  computed: {
    ...mapState('file', {
      _myfileImages: 'myfileImages',
      myfileLoading: 'pending',
    }),
    ...mapState('unsplash', {
      _unsplashImages: 'content',
      unsplashLoading: 'pending',
    }),
    myfileImages(): IPopupReplaceItem[] {
      return [
        spItem('add'),
        ...(this._myfileImages as IAssetPhoto[]).map(img => ({
          type: '' as const,
          key: img.id,
          label: '',
          src: img.urls.tiny,
          uploading: false,
          menuopen: false,
          img,
        })),
        this.myfileLoading ? spItem('loading') : spItem('sentinel')
      ]
    },
    unsplashImages(): IPopupReplaceItem[] {
      const sizeMap = this.$store.state.user.imgSizeMap as Array<{ [key: string]: number | string }>
      const tinySize = sizeMap.find(e => e.key === 'tiny')?.size || 320
      return [
        ...(this._unsplashImages as IPhotoItem[]).map((img, index) => {
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
        this.unsplashLoading ? spItem('loading') : spItem('sentinel')
      ]
    },
    data() {
      return [{
        images: this.myfileImages,
        loadmore: this.loadmoreMyfile,
      }, {
        images: this.unsplashImages,
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
    }),
    handleUploadLogo() {
      if (this.tableIndex !== 0) return
      if (!networkUtils.check()) {
        networkUtils.notifyNetworkError()
      } else if (uploadUtils.isLogin) {
        uploadUtils.chooseAssets('image')
      }
    },
    clickImg(item: IPopupReplaceItem) {
      if (!item.img) return
      this.selectImg(item.img)
      this.closePopup()
    },
    closePopup() {
      popupUtils.closePopup()
    },
  }
})
</script>

<style lang="scss" scoped>
.panel-replace {
  width: 80vw;
  height: 80vh;
  padding: 30px 24px 0 24px;
  box-sizing: border-box;
  background-color: white;
  overflow: hidden auto;
  .tabs {
    width: 200px;
    margin-bottom: 40px;
  }
}
</style>
