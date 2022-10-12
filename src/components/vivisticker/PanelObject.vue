<template lang="pug">
  div(class="panel-objects" :class="{'in-category': isInCategory}")
    search-bar(v-if="!isInCategory"
      class="panel-objects__searchbar"
      :placeholder="$t('NN0092', {target: $tc('NN0003',1)})"
      clear
      :defaultKeyword="keywordLabel"
      vivisticker="dark"
      :color="{close: 'black-5', search: 'black-5'}"
      @search="handleSearch")
    div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
    category-list(v-for="item in categoryListArray"
                  v-show="item.show" :ref="item.key" :key="item.key"
                  :list="item.content" @loadMore="handleLoadMore")
      template(v-slot:category-list-rows="{ list, title }")
        category-list-rows(
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
      template(v-if="pending" #after)
        div(class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryObjectItem from '@/components/category/CategoryObjectItem.vue'
import { ICategoryItem, ICategoryList, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import i18n from '@/i18n'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryListRows,
    CategoryObjectItem
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
    ...mapGetters({
      isTabInCategory: 'vivisticker/getIsInCategory',
      isTabShowAllRecently: 'vivisticker/getShowAllRecently'
    }),
    ...mapState('objects', {
      categories: 'categories',
      rawContent: 'content',
      rawSearchResult: 'searchResult',
      pending: 'pending',
      keyword: 'keyword'
    }),
    isInCategory(): boolean {
      return this.isTabInCategory('object')
    },
    showAllRecently(): boolean {
      return this.isTabShowAllRecently('object')
    },
    keywordLabel(): string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    listCategories(): ICategoryItem[] {
      const { categories } = this
      return (categories as IListServiceContentData[])
        .filter(category => category.list.length > 0)
        .map((category, index) => ({
          size: 140,
          id: `rows_${index}_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.is_recent ? category.list.slice(0, 10) : category.list,
          title: category.title
        }))
    },
    listRecently(): ICategoryItem[] {
      const { categories } = this
      const list = (categories as IListServiceContentData[]).find(category => category.is_recent)?.list ?? []
      const result = new Array(Math.ceil(list.length / 3))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 3, idx * 3 + 3)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-object-item',
            list: rowItems,
            size: 90,
            title: ''
          }
        })
      return result
    },
    listResult(): ICategoryItem[] {
      return this.processListResult(this.rawContent.list)
    },
    searchResult(): ICategoryItem[] {
      const list = this.processListResult(this.rawSearchResult.list)
      if (list.length !== 0) {
        Object.assign(list[list.length - 1], { sentinel: true })
      }
      return list
    },
    mainContent(): ICategoryItem[] {
      if (this.showAllRecently) {
        return this.listRecently
      }
      const list = generalUtils.deepCopy(this.listCategories.concat(this.listResult))
      if (list.length !== 0) {
        Object.assign(list[list.length - 1], { sentinel: true })
      }
      return list
    },
    categoryListArray(): ICategoryList[] {
      return [{
        content: this.searchResult,
        show: this.keyword,
        key: 'searchResult'
      }, {
        content: this.mainContent,
        show: !this.keyword,
        key: 'mainContent'
      }]
    },
    emptyResultMessage(): string {
      const { keyword, pending } = this
      if (pending || !keyword || this.searchResult.length > 0 || this.showAllRecently) return ''
      return `${i18n.t('NN0393', {
          keyword: this.keywordLabel,
          target: i18n.tc('NN0003', 1)
        })}`
    }
  },
  mounted() {
    generalUtils.panelInit('object',
      this.handleSearch,
      this.handleCategorySearch,
      async () => {
        await this.getRecAndCate('objects')
      }
    )
  },
  activated() {
    this.$refs.mainContent[0].$el.scrollTop = this.scrollTop.mainContent
    this.$refs.searchResult[0].$el.scrollTop = this.scrollTop.searchResult
    this.$refs.mainContent[0].$el.addEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'mainContent'))
    this.$refs.searchResult[0].$el.addEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'searchResult'))
  },
  deactivated() {
    this.$refs.mainContent[0].$el.removeEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'mainContent'))
    this.$refs.searchResult[0].$el.removeEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'searchResult'))
  },
  watch: {
    keyword(newVal: string) {
      if (!newVal) {
        this.$nextTick(() => {
          // Will recover scrollTop if do search => switch to other panel => switch back => cancel search.
          this.$refs.mainContent[0].$el.scrollTop = this.scrollTop.mainContent
        })
      }
    }
  },
  methods: {
    ...mapActions('objects', [
      'getContent',
      'getTagContent',
      'getRecently',
      'getRecAndCate',
      'getMoreContent',
      'resetSearch'
    ]),
    handleSearch(keyword: string) {
      this.resetSearch()
      if (keyword) {
        this.getTagContent({ keyword })
      }
    },
    handleCategorySearch(keyword: string, locale = '') {
      this.resetSearch()
      if (keyword) {
        if (keyword === `${this.$t('NN0024')}`) {
          vivistickerUtils.setShowAllRecently('object', true)
        } else {
          this.getContent({ keyword, locale })
        }
        vivistickerUtils.setIsInCategory('object', true)
      } else {
        vivistickerUtils.setShowAllRecently('object', false)
      }
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    handleScrollTop(event: Event, key: 'mainContent'|'searchResult') {
      this.scrollTop[key] = (event.target as HTMLElement).scrollTop
    },
    processListResult(list = [] as IListServiceContentDataItem[]): ICategoryItem[] {
      return new Array(Math.ceil(list.length / 3))
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
  overflow-x: hidden;
  padding: 0 24px;
  &__searchbar {
    margin-top: 24px;
    margin-bottom: 14px;
  }
  &__item {
    width: 80px;
    height: 80px;
    margin: 0 auto;
  }
  &__items {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
  &.in-category::v-deep .vue-recycle-scroller__item-wrapper {
    margin-top: 48px;
  }
}

.panel-objects-2html {
  > input:focus {
    width: 1000px;
    border: 1px solid black;
  }
  > button { margin: 10px auto; }
}

.space {
  margin-bottom: 33px;
}
</style>
