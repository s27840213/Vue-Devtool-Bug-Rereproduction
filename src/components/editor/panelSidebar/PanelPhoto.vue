<template lang="pug">
div(class="panel-photo")
  search-bar(class="mb-15"
    :style="searchBarStyle()"
    :placeholder="$t('NN0092', {target: $tc('NN0002',1)})"
    clear
    :defaultKeyword="keyword"
    @search="handleSearch")
  div(v-if="keyword && !pending && !searchResult.length"
    class="text-white text-left") {{$t('NN0393', {keyword: keyword, target: $tc('NN0002',1)})}}
  //- Search result and main content
  image-gallery(v-for="item in categoryListArray"
                v-show="item.show" :ref="item.key" :key="item.key"
                :images="item.content" @loadMore="handleLoadMore" vendor="unsplash"
                @scroll.passive="handleScrollTop($event, item.key)")
    template(#pending)
      div(v-if="pending" class="text-center")
        svg-icon(iconName="loading"
          iconColor="white"
          iconWidth="20px")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import ImageGallery, { CImageGallery } from '@/components/image-gallery/ImageGallery.vue'
import generalUtils from '@/utils/generalUtils'

export default defineComponent({
  name: 'PanelPhoto',
  emits: [],
  components: {
    SearchBar,
    ImageGallery
  },
  data() {
    return {
      scrollTop: {
        mainContent: 0,
        searchResult: 0
      }
    }
  },
  computed: {
    ...mapState('unsplash', [
      'content',
      'searchResult',
      'keyword',
      'pending'
    ]),
    categoryListArray(): any[] {
      return [{
        content: this.searchResult,
        show: this.keyword,
        key: 'searchResult'
      }, {
        content: this.content,
        show: !this.keyword,
        key: 'mainContent'
      }]
    }
  },
  mounted() {
    generalUtils.panelInit('photo',
      this.handleSearch,
      async () => { /**/ },
      () => this.getPhotos({ keyword: '' })
    )
  },
  activated() {
    const mainContent = (this.$refs.mainContent as CImageGallery[])[0]
    const searchResult = (this.$refs.searchResult as CImageGallery[])[0]
    mainContent.$el.scrollTop = this.scrollTop.mainContent
    searchResult.$el.scrollTop = this.scrollTop.searchResult
  },
  watch: {
    keyword(newVal: string) {
      if (!newVal) {
        this.$nextTick(() => {
          // Will recover scrollTop if do search => switch to other panel => switch back => cancel search.
          const mainContent = (this.$refs.mainContent as CImageGallery[])[0]
          mainContent.$el.scrollTop = this.scrollTop.mainContent
        })
      }
    }
  },
  methods: {
    ...mapActions('unsplash', [
      'getPhotos',
      'getMorePhotos',
      'resetSearch'
    ]),
    async handleSearch(keyword?: string) {
      this.resetSearch()
      if (keyword) {
        await this.getPhotos({ keyword })
      }
    },
    handleLoadMore() {
      !this.pending && this.getMorePhotos()
    },
    handleScrollTop(event: Event, key: 'mainContent'|'searchResult') {
      this.scrollTop[key] = (event.target as HTMLElement).scrollTop
    },
    searchBarStyle() {
      if (this.pending) {
        return {
          'pointer-events': 'none'
        }
      } else {
        return {
          'pointer-events': 'unset'
        }
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-photo {
  @include size(100%, 100%);
  display: grid;
  // Use minmax(0, 1fr) instead of 1fr is because when the content is larger than container, 1fr will almost equal to auto.
  // If you wanna to know this problem in detailed, please go to https://stackoverflow.com/questions/52861086/why-does-minmax0-1fr-work-for-long-elements-while-1fr-doesnt
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-columns: 1fr;
}
</style>
