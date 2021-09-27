<template lang="pug">
  div(class="panel-template")
    search-bar(class="mb-15"
      placeholder="Search from our templates"
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
          template(v-slot:preview="{ item }")
            category-template-item(class="panel-template__item"
              :item="item")
      template(v-slot:category-template-item="{ list, title }")
        div(class="panel-template__items")
          div(v-if="title"
            class="panel-template__header") {{ title }}
          category-template-item(v-for="item in list"
            class="panel-template__item"
            :key="item.id"
            :item="item")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryTemplateItem from '@/components/category/CategoryTemplateItem.vue'
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryListRows,
    CategoryTemplateItem
  },
  computed: {
    ...mapState(
      'templates',
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
      return (categories as IListServiceContentData[])
        .map(category => ({
          size: 225,
          id: `rows_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
    },
    listResult(): any[] {
      const { keyword } = this
      const { list = [] } = this.content as { list: IListServiceContentDataItem[] }
      const result = new Array(Math.ceil(list.length / 2))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 2, idx * 2 + 2)
          const title = !keyword && !idx ? '所有模板' : ''
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-template-item',
            list: rowItems,
            title,
            size: title ? (179 + 46) : 179,
            sentinel: !idx
          }
        })
      return result
    },
    list(): any[] {
      return this.listCategories.concat(this.listResult)
    },
    emptyResultMessage(): string {
      return this.keyword && !this.pending && !this.listResult.length ? `Sorry, we couldn't find any templates for "${this.keyword}".` : ''
    }
  },
  mounted() {
    this.getCategories()
    this.getContent()
  },
  destroyed() {
    this.resetContent()
  },
  methods: {
    ...mapActions('templates',
      [
        'resetContent',
        'getContent',
        'getCategories',
        'getMoreContent'
      ]
    ),
    handleSearch(keyword: string) {
      this.resetContent()
      this.getContent({ keyword })
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
.panel-template {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  &__item {
    width: 145px;
    text-align: center;
    vertical-align: middle;
  }
  &__items {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    column-gap: 10px;
  }
  &__header {
    grid-column: 1 / 3;
    line-height: 26px;
    color: #ffffff;
    padding: 10px 0;
    text-align: left;
  }
}
</style>
