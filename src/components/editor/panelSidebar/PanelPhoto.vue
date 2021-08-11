<template lang="pug">
  div(class="panel-photo")
    search-bar(class="mb-15"
      placeholder="input keywords..."
      @search="handleSearch")
    div(v-if="!pending && !list.length") Sorry, we couldn't find any photos for "{{ query }}".
    tmp-images(v-else
      @loadMore="handleLoadMore")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
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
    ])
  },
  created () {
    this.handleSearch()
  },
  methods: {
    async handleSearch (keyword?: string) {
      await this.$store.commit('photos/SET_STATE', { list: [] })
      this.$store.dispatch('photos/getPhotosFromUnsplash', { query: keyword })
    },
    handleLoadMore () {
      !this.pending && this.$store.dispatch('photos/getMorePhotosFromUnsplash')
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
