<template lang="pug">
  div(class="panel-object")
    search-bar(class="mb-15"
      placeholder="Search objects"
      @search="handleSearch")
    div(v-if="isDisplayByCategory")
      div(v-for="content in contents"
        :key="content.category_id"
        class="panel-object__items")
        category-object-item(v-for="item in content.list"
          class="panel-object__item"
          :key="item"
          :src="`${host}${item}/${preview}`"
          :objectId="item"
          @init="fetchJson")
    category-list(v-else
      :contents="contents"
      @action="handleAction")
      template(v-slot:item="{ item }")
        category-object-item(class="panel-object__item"
          :src="`${host}${item}/${preview}`"
          :objectId="item"
          @init="fetchJson")
    observer-sentinel(v-if="hasNextPage"
      target=".panel-object"
      @callback="handleLoadMore")
    div(class="text-center")
      svg-icon(v-if="pending"
        :iconName="'loading'"
        :iconColor="'gray-2'"
        :iconWidth="'20px'")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import CategoryObjectItem from '@/components/category/CategoryObjectItem.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import { IListServiceContentData } from '@/interfaces/api'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryObjectItem
  },
  computed: {
    ...mapState(
      'objects',
      [
        'contents',
        'pending',
        'host',
        'json',
        'preview',
        'category'
      ]
    ),
    ...mapGetters('objects', ['hasNextPage']),
    isDisplayByCategory () {
      return typeof this.category === 'number'
    }
  },
  mounted () {
    this.$store.dispatch('objects/getContent')
  },
  methods: {
    handleAction (data: IListServiceContentData) {
      const { category_id: category } = data
      this.$store.dispatch('objects/getContent', { category })
    },
    handleSearch () {
      this.$store.dispatch('objects/getContent')
    },
    fetchJson (id: string) {
      this.$store.dispatch('objects/getContentJson', id)
    },
    handleLoadMore () {
      console.log('handleLoadMore')
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-object {
  @include size(100%, 100%);
  &__item {
    width: 80px;
    height: 80px;
    object-fit: contain;
    vertical-align: middle;
    margin: auto;
  }
  &__items {
    display: grid;
    grid-auto-rows: auto;
    grid-template-columns: repeat(3,1fr);
    grid-gap: 10px;
  }
}
</style>
