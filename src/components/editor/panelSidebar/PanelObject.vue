<template lang="pug">
  div(class="panel-objects")
    search-bar(class="mb-15"
      :placeholder="$t('NN0092', {target: $tc('NN0003',1)})"
      clear
      :defaultKeyword="keyword"
      @search="handleSearch")
    div(v-if="emptyResultMessage" class="text-white") {{ emptyResultMessage }}
    category-list(ref="list"
      :list="list"
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
          @action="handleCategorySearch")
          template(v-slot:preview="{ item }")
            category-object-item(class="panel-objects__item"
              :item="item")
      template(v-slot:category-object-item="{ list }")
        div(class="panel-objects__items")
          category-object-item(v-for="item in list"
            class="panel-objects__item"
            :key="item.id"
            :item="item")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryObjectItem from '@/components/category/CategoryObjectItem.vue'
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import i18n from '@/i18n'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryListRows,
    CategoryObjectItem
  },
  data() {
    return {
      scrollTop: 0
    }
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
      return (categories as IListServiceContentData[])
        .map(category => ({
          size: 140,
          id: `rows_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
    },
    listResult(): any[] {
      const { keyword } = this
      if (!keyword) { return [] }
      const { list = [] } = this.content as { list: IListServiceContentDataItem[] }
      const result = new Array(Math.ceil(list.length / 3))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 3, idx * 3 + 3)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-object-item',
            list: rowItems,
            size: 90
          }
        })
      if (result.length) {
        Object.assign(result[result.length - 1], { sentinel: true })
      }
      return result
    },
    list(): any[] {
      return this.listCategories.concat(this.listResult)
    },
    emptyResultMessage(): string {
      return this.keyword && !this.pending && !this.listResult.length ? `${i18n.t('NN0393', { keyword: this.keyword, target: i18n.tc('NN0003', 1) })}` : `${i18n.t('NN0394', { target: i18n.tc('NN0003', 1) })}`
    }
  },
  mounted() {
    (this.$refs.list as Vue).$el.addEventListener('scroll', (event: Event) => {
      this.scrollTop = (event.target as HTMLElement).scrollTop
    })
    this.getCategories()
  },
  activated() {
    const el = (this.$refs.list as Vue).$el
    el.scrollTop = this.scrollTop
    el.addEventListener('scroll', this.handleScrollTop)
  },
  deactivated() {
    (this.$refs.list as Vue).$el.removeEventListener('scroll', this.handleScrollTop)
  },
  destroyed() {
    this.resetContent()
  },
  methods: {
    ...mapActions('objects',
      [
        'resetContent',
        'getContent',
        'getTagContent',
        'getCategories',
        'getMoreContent'
      ]
    ),
    handleSearch(keyword: string) {
      if (keyword) {
        this.getTagContent({ keyword })
      } else {
        this.resetContent()
        this.getCategories()
      }
    },
    handleCategorySearch(keyword: string) {
      keyword ? this.getContent({ keyword }) : this.resetContent()
    },
    handleLoadMore() {
      console.log('object load more')
      this.getMoreContent()
    },
    handleScrollTop(event: Event) {
      this.scrollTop = (event.target as HTMLElement).scrollTop
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
  }
  &__items {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
