<template lang="pug">
  div(class="panel-photo")
    search-bar(class="panel-photo__search"
      placeholder="input keywords..."
      @search="handleSearch")
    div(v-if="!pending && !list.length") Sorry, we couldn't find any photos for "{{ query }}".
    tmp-images(v-else
      :photos="getCurrentPagePhotos"
      @loadMore="handleLoadMore")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState, mapGetters } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'

export default Vue.extend({
  components: {
    SearchBar
  },
  computed: {
    ...mapState('photos', [
      'query',
      'list',
      'pending'
    ]),
    ...mapGetters('photos', [
      'getCurrentPagePhotos'
    ])
  },
  created () {
    this.handleSearch()
  },
  methods: {
    async handleSearch (keyword?: string) {
      await this.$store.commit('photos/SET_STATE', { list: [] })
      this.$store.dispatch('photos/getPhotosFromPexels', { query: keyword })
    },
    handleLoadMore () {
      if (!this.pending) {
        this.$store.dispatch('photos/getMorePhotosFromPexels')
      }
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
  &__search {
    margin-bottom: 10px;
  }
}
</style>
