<template lang="pug">
  div(class="panel-file"
      @drop.stop.prevent="onDrop($event)"
      @dragover.prevent,
      @dragenter.prevent)
    span(class="panel-file__title text-blue-1 label-lg") {{$t('NN0006')}}
    btn(class="full-width mb-20"
      :type="'primary-mid'"
      @click.native="uploadImage()") {{$t('NN0014')}}
    image-gallery(
      ref="gallery"
      :myfile="list"
      vendor="myfile"
      :inFilePanel="true"
      @loadMore="handleLoadMore")
      template(#pending)
        div(v-if="pending" class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
    transition(name="panel-up")
      div(v-if="hasCheckedAssets"
          class="panel-file__menu")
        div
          //- svg-icon(class="pointer"
          //-   :iconName="'folder'"
          //-   :iconColor="'white'"
          //-   :iconWidth="'24px'")
          svg-icon(class="pointer"
            :iconName="'trash'"
            :iconColor="'white'"
            :iconWidth="'24px'"
            @click.native="deleteAssets()")
        span(class="text-blue-1 pointer" @click="clearCheckedAssets()") {{`${$t('NN0130')}(${checkedAssets.length})`}}
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import uploadUtils from '@/utils/uploadUtils'
import GalleryUtils from '@/utils/galleryUtils'
import GalleryPhoto from '@/components/GalleryPhoto.vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import modalUtils from '@/utils/modalUtils'
import networkUtils from '@/utils/networkUtils'
import ImageGallery from '@/components/image-gallery/ImageGallery.vue'

export default Vue.extend({
  components: {
    SearchBar,
    GalleryPhoto,
    ImageGallery
  },
  data() {
    return {
      galleryUtils: new GalleryUtils(300, 75, 5),
      online: true,
      scrollTop: 0
    }
  },
  created() {
    networkUtils.onNetworkChange((online) => {
      this.online = online
    })

    this.online = navigator.onLine
  },
  beforeDestroy() {
    networkUtils.offNetworkCahnge()
  },
  computed: {
    ...mapState('file', [
      'list',
      'pending'
    ]),
    ...mapGetters({
      checkedAssets: 'file/getCheckedAssets'
    }),
    margin(): number {
      return this.galleryUtils.margin
    },
    hasCheckedAssets(): boolean {
      return this.checkedAssets.length !== 0
    }
  },
  mounted () {
    (this.$refs.gallery as any).myfileUpdate()
  },
  watch: {
    list (curr, prev) {
      if (curr.length && !prev.length && this.$refs.gallery) {
        const list = (this.$refs.gallery as Vue).$el.children[0]
        list.addEventListener('scroll', (event: Event) => {
          this.scrollTop = (event.target as HTMLElement).scrollTop
        })
      }
      if (!curr.length && prev.length) {
        this.scrollTop = 0
      }
    }
  },
  methods: {
    ...mapActions({
      deleteAssets: 'file/deleteAssets',
      getMoreMyfiles: 'file/getMoreMyfiles'
    }),
    ...mapMutations({
      clearCheckedAssets: 'file/CLEAR_CHECKED_ASSETS'
    }),
    handleLoadMore() {
      !this.pending && this.getMoreMyfiles()
    },
    uploadImage() {
      if (!this.online) {
        networkUtils.notifyNetworkError()
      } else if (uploadUtils.isLogin) {
        uploadUtils.chooseAssets('image')
      } else {
        modalUtils.setIsModalOpen(true)
        modalUtils.setModalInfo(`${this.$t('NN0350')}`, [], '')
      }
    },
    onDrop(evt: DragEvent) {
      const dt = evt.dataTransfer
      if (evt.dataTransfer?.getData('data') || !dt) {
      } else {
        const files = dt.files
        if (!this.online) {
          networkUtils.notifyNetworkError()
        } else if (uploadUtils.isLogin) {
          uploadUtils.uploadAsset('image', files)
        } else {
          modalUtils.setIsModalOpen(true)
          modalUtils.setModalInfo(`${this.$t('NN0350')}`, [], '')
        }
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-file {
  @include size(100%, 100%);
  display: grid;
  // Use minmax(0, 1fr) instead of 1fr is because when the content is larger than container, 1fr will almost equal to auto.
  // If you wanna to know this problem in detailed, please go to https://stackoverflow.com/questions/52861086/why-does-minmax0-1fr-work-for-long-elements-while-1fr-doesnt
  grid-template-rows: auto auto minmax(0, 1fr);
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
</style>
