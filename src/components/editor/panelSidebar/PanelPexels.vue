<template lang="pug">
div(class="panel-photo")
  search-bar(class="mb-15"
    :placeholder="$t('NN0092', {target: 'Pexels'})"
    @search="handleSearch")
  div(v-if="!pending && !list.length"
    class="text-white text-left") {{$t('NN0393', {keyword: query, target: "Pexels"})}}
  tmp-images(v-else
    @loadMore="handleLoadMore")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'

export default defineComponent({
  emits: [],
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
      this.$store.dispatch('photos/getPhotosFromPexels', { query: keyword })
    },
    handleLoadMore () {
      !this.pending && this.$store.dispatch('photos/getMorePhotosFromPexels')
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
