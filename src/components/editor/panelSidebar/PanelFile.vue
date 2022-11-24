<template lang="pug">
div(class="panel-file"
    @drop.stop.prevent="onDrop($event)"
    @dragover.prevent,
    @dragenter.prevent)
  btn(class="full-width mb-20" :type="'primary-mid'"
      @click.native="uploadImage()") {{$t('NN0014')}}
  image-gallery(
    ref="mainContent"
    :myfile="myfileImages"
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
import { defineComponent } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import uploadUtils from '@/utils/uploadUtils'
import GalleryPhoto from '@/components/GalleryPhoto.vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import modalUtils from '@/utils/modalUtils'
import networkUtils from '@/utils/networkUtils'
import ImageGallery from '@/components/image-gallery/ImageGallery.vue'

export default defineComponent({
  components: {
    SearchBar,
    GalleryPhoto,
    ImageGallery
  },
  data() {
    return {
      scrollTop: {
        mainContent: 0
        // searchResult: 0
      }
    }
  },
  computed: {
    ...mapState('file', [
      'myfileImages',
      'pending'
    ]),
    ...mapGetters({
      checkedAssets: 'file/getCheckedAssets'
    }),
    hasCheckedAssets(): boolean {
      return this.checkedAssets.length !== 0
    }
  },
  mounted() {
    (this.$refs.mainContent as any).myfileUpdate()
  },
  activated() {
    (this.$refs.mainContent as any).$el.children[0].scrollTop = this.scrollTop.mainContent;
    (this.$refs.mainContent as any).$el.children[0].addEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'mainContent'))
  },
  deactivated() {
    (this.$refs.mainContent as any).$el.children[0].removeEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'mainContent'))
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
      if (!networkUtils.check()) {
        networkUtils.notifyNetworkError()
      } else if (uploadUtils.isLogin) {
        uploadUtils.chooseAssets('image')
      } else {
        modalUtils.setModalInfo(`${this.$t('NN0350')}`, [])
      }
    },
    handleScrollTop(event: Event, key: 'mainContent'/* |'searchResult' */) {
      this.scrollTop[key] = (event.target as HTMLElement).scrollTop
    },
    onDrop(evt: DragEvent) {
      const dt = evt.dataTransfer
      if (evt.dataTransfer?.getData('data') || !dt) {
      } else {
        const files = dt.files
        if (!networkUtils.check()) {
          networkUtils.notifyNetworkError()
        } else if (uploadUtils.isLogin) {
          uploadUtils.uploadAsset('image', files)
        } else {
          modalUtils.setModalInfo(`${this.$t('NN0350')}`, [])
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
  grid-template-rows: auto minmax(0, 1fr);
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
