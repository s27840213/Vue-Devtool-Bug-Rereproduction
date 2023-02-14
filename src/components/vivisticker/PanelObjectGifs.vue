<template lang="pug">
  div(class="panel-gifs" :class="{'in-category': isInCategory}")
    //- Search bar
    search-bar(v-if="!isInCategory && !showFav"
      class="panel-gifs__searchbar"
      :placeholder="$t('NN0092', { target: 'GIFs' })"
      clear
      :defaultKeyword="keywordLabel"
      vivisticker="dark"
      :color="{close: 'black-5', search: 'black-5'}"
      :isFavorite="checkTagFavorite(keyword)"
      @search="handleSearch"
      @favorite="toggleFavoritesTag")
    tags(v-if="isInCategory && tags && tags.length" class="panel-gifs__tags"
        :tags="tags" theme="dark" @search="handleSearch")
    //- Search result and static main content
    category-list(v-for="item in categoryListArray"
                  v-show="item.show" :ref="item.key" :key="item.key"
                  :list="item.content" @loadMore="item.loadMore")
      template(#before)
        div(class="panel-gifs__top-item")
        tags(v-if="!isInCategory && tags && tags.length" class="panel-gifs__tags" style="margin-top: 0"
            :tags="tags" theme="dark" @search="handleSearch")
        //- Search result empty msg
        div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
        //- Empty favorites view
        div(v-if="showFav && !item.content.length && !pending"
            class="panel-gifs__favorites-empty")
          svg-icon(iconName="favorites-empty" iconWidth="42px" iconColor="white")
          span(class="panel-gifs__favorites-empty--title") {{$t('NN0765')}}
          span(class="text-black-5") {{$t('NN0764')}}
      template(v-slot:category-list-rows="{ list, title, isFavorite }")
        category-list-rows(
          :list="list"
          :title="title"
          :isFavorite="isFavorite")
          template(v-slot:action)
            div(class="panel-gifs__list-rows-action")
              svg-icon(v-if="isFavorite !== undefined"
                      :iconName="isFavorite ? 'favorites-fill' : 'heart'"
                      iconWidth="24px" iconColor="gray-2" @click.native="toggleFaovoritesCategoryByTitle(title)")
              span(@click="item.categorySearch(title)") {{$t('NN0082')}}
          template(v-slot:preview="{ item }")
            category-object-item(class="panel-gifs__item"
              :src="item.src"
              :item="item"
              @click4in1="click4in1"
              @dbclick4in1="toggleFavorites4in1"
              @dbclick="toggleFavoritesItem")
      template(v-slot:category-object-item="{ list }")
        div(class="panel-gifs__items")
          category-object-item(v-for="item in list"
            class="panel-gifs__item"
            :key="item.id"
            :src="item.src"
            :item="item"
            @click4in1="click4in1"
            @dbclick4in1="toggleFavorites4in1"
            @dbclick="toggleFavoritesItem")
      template(v-if="pending" #after)
        div(class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
</template>

<script lang="ts">
import Vue from 'vue'
import i18n from '@/i18n'
import { mapActions, mapGetters, mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import { ICategoryItem, ICategoryList, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import { IGif, IGifCategory, IGifCategoryExtend, isIGifCategory, isITag, ITagExtend } from '@/interfaces/giphy'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryObjectItem from '@/components/category/CategoryObjectItem.vue'
import Tags from '@/components/global/Tags.vue'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'

type refTarget = 'mainContent' | 'searchResult' | 'favoritesContent' | 'favoritesSearchResult'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryListRows,
    CategoryObjectItem,
    Tags
  },
  props: {
    showFav: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      targets: ['mainContent', 'searchResult', 'favoritesContent', 'favoritesSearchResult'] as refTarget[],
      scrollTop: {
        mainContent: 0,
        searchResult: 0,
        favoritesContent: 0,
        favoritesSearchResult: 0
      }
    }
  },
  computed: {
    ...mapGetters({
      isTabInCategory: 'vivisticker/getIsInCategory',
      isTabShowAllRecently: 'vivisticker/getShowAllRecently'
    }),
    ...mapState('giphy', {
      rawCategories: 'categories',
      rawSearchResult: 'searchResult',
      nextTagContent: 'nextTagContent'
    }),
    ...mapGetters('giphy', {
      rawPending: 'pending',
      isSearchingCategory: 'isSearchingCategory',
      isSearchingTag: 'isSearchingTag',
      tagsBar: 'tagsBar',
      favoritesTagsBar: 'favoritesTagsBar',
      keyword: 'keyword',
      checkCategoryFavorite: 'checkCategoryFavorite',
      checkTagFavorite: 'checkTagFavorite',
      favoritesItems: 'favoritesItems',
      favoritesTags: 'favoritesTags',
      favoritesCategories: 'favoritesCategories',
      rawFavoritesSearchResult: 'favoritesSearchResult'
    }),
    isInCategory(): boolean {
      return this.isTabInCategory('object')
    },
    showAllRecently(): boolean {
      return this.isTabShowAllRecently('object')
    },
    pending(): boolean {
      return this.showFav ? this.rawPending.favorites : this.rawPending.content
    },
    keywordLabel(): string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    listCategories(): ICategoryItem[] {
      return this.processListCategory(this.rawCategories)
    },
    listRecently(): ICategoryItem[] {
      const { rawCategories } = this
      const list = (rawCategories as IListServiceContentData[]).find(category => category.is_recent)?.list ?? []
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
    listResult(): ICategoryItem[] { // Don't show all result in PanelObject
      // return this.processListResult(this.rawContent.list)
      return []
    },
    searchResult(): ICategoryItem[] {
      const list = this.processListResult(this.rawSearchResult.content)
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
    favoritesContent(): ICategoryItem[] {
      let result = [] as ICategoryItem[];
      [{ title: i18n.tc('NN0762'), list: this.favoritesItems },
        { title: i18n.tc('NN0761'), list: this.favoritesTags },
        { title: i18n.tc('NN0760'), list: this.favoritesCategories }].forEach(({ title, list }) => {
        result = result.concat(this.processListCategory([{
          id: -1,
          title,
          list: list.slice(0, 10) as IListServiceContentDataItem[]
        }]))
      })
      return result
    },
    favoritesSearchResult(): ICategoryItem[] {
      const rows = this.processListResult(this.rawFavoritesSearchResult.content)
      if (rows.length !== 0) {
        Object.assign(rows[rows.length - 1], { sentinel: true })
      }
      return rows
    },
    categoryListArray(): ICategoryList[] {
      return [{
        content: this.favoritesSearchResult,
        show: this.showFav && this.rawFavoritesSearchResult.title,
        key: 'favoritesSearchResult',
        loadMore: this.searchMoreFavorites,
        categorySearch: () => { /**/ }
      }, {
        content: this.favoritesContent,
        show: this.showFav && !this.rawFavoritesSearchResult.title,
        key: 'favoritesContent',
        loadMore: () => { /**/ },
        categorySearch: this.handleCategorySearch
      }, {
        content: this.searchResult,
        show: !this.showFav && this.keyword,
        key: 'searchResult',
        loadMore: this.handleLoadMore,
        categorySearch: this.handleCategorySearch
      }, {
        content: this.mainContent,
        show: !this.showFav && !this.keyword,
        key: 'mainContent',
        loadMore: this.handleLoadMore,
        categorySearch: this.handleCategorySearch
      }]
    },
    emptyResultMessage(): string {
      const { showFav, keyword, pending } = this
      if (pending || this.showAllRecently) return ''
      if (!showFav && keyword && this.searchResult.length === 0) {
        return `${i18n.t('NN0393', {
          keyword: this.keywordLabel,
          target: 'GIFs'
        })}`
      } else return ''
    },
    tags(): string[] {
      return this.showAllRecently ? []
        : this.showFav ? this.favoritesTagsBar : this.tagsBar
    }
  },
  mounted() {
    generalUtils.panelInit('giphy',
      this.handleSearch,
      this.handleCategorySearch,
      async () => {
        this.initGiphy()
      }
    )
  },
  activated() {
    const ref = this.$refs as Record<string, Vue[]>
    for (const name of this.targets) {
      ref[name][0].$el.scrollTop = this.scrollTop[name]
      ref[name][0].$el.addEventListener('scroll', (e: Event) => this.handleScrollTop(e, name))
    }
  },
  deactivated() {
    const ref = this.$refs as Record<string, Vue[]>
    for (const name of this.targets) {
      ref[name][0].$el.removeEventListener('scroll', (e: Event) => this.handleScrollTop(e, name))
    }
  },
  watch: {
    keyword(newVal: string) {
      if (!newVal) {
        this.$nextTick(() => {
          // Will recover scrollTop if do search => switch to other panel => switch back => cancel search.
          (this.$refs.mainContent as Vue[])[0].$el.scrollTop = this.scrollTop.mainContent
        })
      }
    },
    categoryListArray() {
      this.$nextTick(() => {
        const ref = this.$refs as Record<string, Vue[]>
        for (const name of this.targets) {
          ref[name][0].$el.scrollTop = this.scrollTop[name]
        }
      })
    }
  },
  methods: {
    ...mapActions('giphy', [
      'getCategories',
      'getCategoryContent',
      'getMoreCategoryContent',
      'getMoreTagContent',
      'searchTag',
      'resetCategoryContent',
      'resetTagContent',
      // favorites actions
      'initGiphy',
      'toggleFavorite',
      'searchFavorites',
      'searchMoreFavorites',
      'searchTagInFavoritesCategory'
    ]),
    scrollToTop() {
      for (const list of this.categoryListArray) {
        if (list.show) {
          const categoryList = (this.$refs[list.key] as Vue[])[0]
          const top = categoryList.$el.querySelector('.panel-gifs__top-item') as HTMLElement
          top.scrollIntoView({ behavior: 'smooth' })
        }
      }
    },
    async handleSearch(keyword: string) {
      if (this.showFav) {
        this.searchTagInFavoritesCategory(keyword)
      } else {
        this.resetTagContent()
        if (keyword) {
          this.searchTag(keyword)
        }
      }
    },
    async handleCategorySearch(categoryName: string) {
      if (this.showFav) {
        this.searchFavorites(categoryName)
      } else {
        this.resetCategoryContent()
        if (categoryName === this.$t('NN0024')) {
          vivistickerUtils.setShowAllRecently('object', true)
        } else if (categoryName) {
          this.getCategoryContent(categoryName)
        }
      }
      vivistickerUtils.setIsInCategory('object', true)
    },
    handleLoadMore() {
      if (this.isSearchingTag) {
        this.getMoreTagContent()
      } else if (this.isSearchingCategory) {
        this.getMoreCategoryContent()
      } else {
        this.getCategories()
      }
    },
    click4in1(target: unknown) {
      this.searchFavorites(target)
      vivistickerUtils.setIsInCategory('object', true)
    },
    toggleFavorites4in1(target: ITagExtend | IGifCategoryExtend) {
      if (isITag(target)) {
        this.toggleFavorite({ tags: target.id })
      } else if (isIGifCategory(target)) {
        this.toggleFavorite({ categories: target.id })
      }
    },
    toggleFavoritesItem(target: IGif) {
      this.toggleFavorite({ items: target })
    },
    toggleFavoritesTag() {
      this.toggleFavorite({ tags: `${this.nextTagContent.keyword}:${this.nextTagContent.type}` })
    },
    toggleFaovoritesCategoryByTitle(title: string) {
      for (const category of this.rawCategories as IGifCategory[]) {
        if (category.title === title) {
          this.toggleFavorite({ categories: category.id })
          return
        }
      }
    },
    handleScrollTop(event: Event, key: refTarget) {
      this.scrollTop[key] = (event.target as HTMLElement).scrollTop
    },
    processListCategory(list: IListServiceContentData[]): ICategoryItem[] {
      return list
        .filter(category => category.list.length > 0)
        .map((category, index) => ({
          size: 140,
          id: `rows_${index}_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.is_recent ? category.list.slice(0, 10) : category.list,
          title: category.title,
          isFavorite: category.id === -1 || category.is_recent ? undefined
            : this.checkCategoryFavorite(category.id)
        }))
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
.panel-gifs {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  color: setColor(white);
  overflow: hidden;
  &__searchbar {
    margin-bottom: 14px;
  }
  &__tags {
    margin: 14px 0 18px 0;
    color: setColor(black-5);
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
    margin-top: 24px;
  }
  &__list-rows-action {
    display: flex;
    align-items: center;
    > svg {
      margin-right: 20px;
      padding-right: 20px;
      border-right: 1px solid setColor(gray-2);
    }
  }
  &__favorites-empty {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: calc((100vh - 229px) * 0.8);
    &--title {
      margin: 12px 0 24px 0;
    }
  }
  .category-list {
    overflow-x: hidden;
  }
}
</style>
