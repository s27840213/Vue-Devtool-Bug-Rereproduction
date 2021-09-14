<template lang="pug">
  div(class="panel-objects")
    search-bar(class="mb-15"
      placeholder="Search from our objects"
      clear
      :defaultKeyword="keyword"
      @search="handleSearch")
    div(v-if="emptyResultMessage" class="text-white") {{ emptyResultMessage }}
    category-list(:list="list"
      @loadMore="handleLoadMore")
      template(v-if="pending" #after)
        div(class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
      template(v-slot:category-list-rows="{ list, title }")
        category-list-rows(
          v-if="!keyword"
          :list="list"
          :title="title"
          @action="handleSearch")
          template(v-slot:preview="{ id }")
            category-object-item(class="panel-objects__item"
              :src="`${host}/${id}/${preview}`"
              :objectId="id")
      template(v-slot:category-object-item="{ list }")
        div(class="panel-objects__items")
          category-object-item(v-for="id in list"
            class="panel-objects__item"
            :key="id"
            :src="`${host}/${id}/${preview}`"
            :objectId="id")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryObjectItem from '@/components/category/CategoryObjectItem.vue'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryListRows,
    CategoryObjectItem
  },
  computed: {
    ...mapState(
      'objects',
      [
        'categories',
        'content',
        'pending',
        'host',
        'preview',
        'keyword'
      ]
    ),
    listCategories(): any[] {
      const { keyword, categories } = this
      if (keyword) { return [] }
      return (categories as any[])
        .map(category => ({
          size: 140,
          id: `rows_${category.list.join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
    },
    listResult(): any[] {
      const { keyword } = this
      const { list = [] } = this.content
      const tmpList = [...list]
      const result = []
      if (!keyword) { return [] }
      while (tmpList.length) {
        const rowItems = tmpList.splice(0, 3)
        result.push({
          id: `result_${rowItems.join('_')}`,
          size: 90,
          type: 'category-object-item',
          list: rowItems,
          sentinel: !tmpList.length
        })
      }
      return result
    },
    list(): any[] {
      return this.listCategories.concat(this.listResult)
    },
    emptyResultMessage(): string {
      return this.keyword && !this.pending && !this.listResult.length ? `Sorry, we couldn't find any objects for "${this.keyword}".` : ''
    }
  },
  mounted() {
    this.getCategories()
  },
  destroyed() {
    this.resetContent()
  },
  methods: {
    ...mapActions('objects',
      [
        'resetContent',
        'getContent',
        'getCategories',
        'getMoreContent'
      ]
    ),
    handleSearch(keyword: string) {
      keyword ? this.getContent({ keyword }) : this.resetContent()
    },
    handleLoadMore() {
      this.getMoreContent()
    }
  }
})
</script>

<style lang="scss" scoped>
.search-bar {
  flex: 0 0 auto;
}
.panel-objects {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  &__item {
    width: 80px;
    height: 80px;
    margin: 0 auto;
    object-fit: contain;
    vertical-align: middle;
  }
  &__items {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
