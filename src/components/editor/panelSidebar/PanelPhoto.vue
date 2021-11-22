<template lang="pug">
  div(class="panel-photo")
    search-bar(class="mb-15"
      placeholder="input keywords..."
      clear
      @search="handleSearch")
    div(v-if="!pending && !list.length"
      class="text-white") Sorry, we couldn't find any photos for "{{ keyword }}".
    image-gallery(v-else
      ref="gallery"
      :images="list"
      vendor="unsplash"
      @loadMore="handleLoadMore")
      template(#pending)
        div(v-if="pending" class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import ImageGallery from '@/components/image-gallery/ImageGallery.vue'
// import photo from '@/store/module/photo'

const moduleName = 'unsplash'

export default Vue.extend({
  components: {
    SearchBar,
    ImageGallery
  },
  data () {
    return {
      scrollTop: 0
    }
  },
  computed: {
    ...mapState(moduleName, [
      'keyword',
      'list',
      'pending'
    ])
  },
  mounted () {
    this.handleSearch()
  },
  destroyed () {
    // this.$store.unregisterModule(moduleName)
  },
  activated () {
    if (this.$refs.gallery) {
      const list = (this.$refs.gallery as Vue).$el.children[0]
      list.scrollTop = this.scrollTop
    }
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
    async handleSearch (keyword?: string) {
      await this.$store.commit(`${moduleName}/SET_STATE`, { list: [] })
      this.$store.dispatch(`${moduleName}/getPhotos`, { keyword })
    },
    handleLoadMore () {
      !this.pending && this.$store.dispatch(`${moduleName}/getMorePhotos`)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-photo {
  @include size(100%, 100%);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-columns: 1fr;
}
</style>
