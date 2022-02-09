<template lang="pug">
  div(class="panel-file"
      @drop.stop.prevent="onDrop($event)"
      @dragover.prevent,
      @dragenter.prevent)
    span(class="panel-file__title text-blue-1 label-lg") {{$t('NN0006')}}
    btn(class="full-width mb-20"
      :type="'primary-mid'"
      @click.native="uploadImage()") {{$t('NN0014')}}
    tmp-files(
      :inFilePanel="true")
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
import { mapActions, mapGetters, mapMutations } from 'vuex'
import modalUtils from '@/utils/modalUtils'
import networkUtils from '@/utils/networkUtils'

export default Vue.extend({
  components: {
    SearchBar,
    GalleryPhoto
  },
  data() {
    return {
      galleryUtils: new GalleryUtils(300, 75, 5),
      online: true
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
    ...mapGetters({
      checkedAssets: 'user/getCheckedAssets'
    }),
    margin(): number {
      return this.galleryUtils.margin
    },
    hasCheckedAssets(): boolean {
      return this.checkedAssets.length !== 0
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
