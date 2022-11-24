<template lang="pug">
div(class="panel-objects")
  //- Search bar
  search-bar(class="mb-15"
    :placeholder="$t('NN0092', {target: $tc('NN0003',1)})"
    clear
    :defaultKeyword="keywordLabel"
    @search="handleSearch")
  //- Admin tool
  div(v-if="inAdminMode" class="panel-objects-2html")
    input(type="text" placeholder="項目網址" v-model="panelParams")
    btn(@click.native="downloadAll") Download all
  //- Search result empty msg
  div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
  //- Search result and main content
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
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryObjectItem from '@/components/category/CategoryObjectItem.vue'
import { ICategoryItem, ICategoryList, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import generalUtils from '@/utils/generalUtils'

export default defineComponent({
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
      },
      // For object2wphtml
      panelParams: ''
    }
  },
  computed: {
    ...mapGetters({
      isAdmin: 'user/isAdmin'
    }),
    ...mapState('objects', {
      categories: 'categories',
      rawContent: 'content',
      rawSearchResult: 'searchResult',
      pending: 'pending',
      keyword: 'keyword'
    }),
    ...mapState('user', [
      'adminMode'
    ]),
    inAdminMode(): boolean {
      return this.isAdmin && this.adminMode
    },
    keywordLabel():string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    listCategories(): ICategoryItem[] {
      const { categories } = this
      return (categories as IListServiceContentData[])
        .map((category, index) => ({
          size: 140,
          id: `rows_${index}_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
    },
    listResult(): ICategoryItem[] { // Don't show all result in PanelObject
      // return this.processListResult(this.rawContent.list)
      return []
    },
    searchResult(): ICategoryItem[] {
      const list = this.processListResult(this.rawSearchResult.list)
      if (list.length !== 0) {
        Object.assign(list[list.length - 1], { sentinel: true })
      }
      return list
    },
    mainContent(): ICategoryItem[] {
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
      if (pending || !keyword || this.searchResult.length > 0) return ''
      return `${this.$t('NN0393', {
          keyword: this.keywordLabel,
          target: this.$tc('NN0003', 1)
        })}`
    }
  },
  mounted() {
    generalUtils.panelInit('object',
      this.handleSearch,
      this.handleCategorySearch,
      this.getRecAndCate
    )
  },
  activated() {
    const mainContent = (this.$refs.mainContent as any)[0]
    const searchResult = (this.$refs.searchResult as any)[0]
    mainContent.$el.scrollTop = this.scrollTop.mainContent
    searchResult.$el.scrollTop = this.scrollTop.searchResult
    mainContent.$el.addEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'mainContent'))
    searchResult.$el.addEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'searchResult'))
  },
  deactivated() {
    const mainContent = (this.$refs.mainContent as any)[0]
    const searchResult = (this.$refs.searchResult as any)[0]
    mainContent.$el.removeEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'mainContent'))
    searchResult.$el.removeEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'searchResult'))
  },
  watch: {
    keyword(newVal: string) {
      if (!newVal) {
        this.$nextTick(() => {
          // Will recover scrollTop if do search => switch to other panel => switch back => cancel search.
          const mainContent = (this.$refs.mainContent as any)[0]
          mainContent.$el.scrollTop = this.scrollTop.mainContent
        })
      }
    }
  },
  methods: {
    ...mapActions('objects', [
      'getContent',
      'getTagContent',
      'getRecAndCate',
      'getMoreContent',
      'resetSearch'
    ]),
    handleSearch(keyword: string) {
      this.resetSearch()
      if (keyword) {
        this.panelParams = `http://vivipic.com/editor?panel=object&search=${keyword.replace(/&/g, '%26')}&type=new-design-size&width=1080&height=1080&themeId=1`
        this.getTagContent({ keyword })
      }
    },
    handleCategorySearch(keyword: string, locale = '') {
      this.resetSearch()
      if (keyword) {
        this.panelParams = `http://vivipic.com/editor?panel=object&category=${keyword.replace(/&/g, '%26')}&category_locale=${this.$i18n.locale}&type=new-design-size&width=1080&height=1080&themeId=1`
        this.getContent({ keyword, locale })
      }
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    handleScrollTop(event: Event, key: 'mainContent'|'searchResult') {
      this.scrollTop[key] = (event.target as HTMLElement).scrollTop
    },
    downloadAll() {
      generalUtils.copyText(this.panelParams)
      // this.$notify({ group: 'copy', text: '已複製網址到剪貼簿' })
      const links = this.mainContent.map((it) => {
        return it.list.map((it) => {
          return `https://template.vivipic.com/svg/${it.id}/prev?ver=${it.ver}`
        }).join('\n')
      }).join('\n')
      generalUtils.downloadTextFile(`${this.keywordLabel}.txt`, links)
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
            size: 104 // 80(object height) + 24(gap)
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

.panel-objects-2html {
  > input:focus {
    border: 1px solid black;
  }
  > button { margin: 10px auto; }
}
</style>
