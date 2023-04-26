<template lang="pug">
div(class="panel-static" :class="{'in-category': isInCategory, 'with-search-bar': showSearchBar}")
  //- Search bar
  search-bar(v-if="showSearchBar"
    class="panel-static__searchbar"
    :placeholder="$t('NN0092', { target: $tc('NN0003', 1) })"
    clear
    :defaultKeyword="keywordLabel"
    vivisticker="dark"
    :color="{close: 'black-5', search: 'black-5'}"
    :isFavorite="keywordIsFavaorites"
    v-model:expanded="isSearchBarExpanded"
    @search="handleSearch"
    @favorite="toggleFavoritesTag")
  tags(v-if="tags && tags.length"
      class="panel-static__tags"
      :class="{collapsed: !isSearchBarExpanded}"
      :tags="tags"
      :scrollLeft="tagScrollLeft"
      theme="dark"
      @search="handleSearch"
      @scroll="(scrollLeft: number) => tagScrollLeft = scrollLeft")
  //- Search result and static main content
  category-list(v-for="item in categoryListArray"
                :class="{invisible: !item.show, collapsed: !isSearchBarExpanded}"
                :ref="item.key" :key="item.key"
                :list="item.content" @loadMore="item.loadMore")
    template(#before)
      div(class="panel-static__top-item")
      //- Search result empty msg
      div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
      //- Empty favorites view
      div(v-if="showFav && !item.content.length && !pending"
          class="panel-static__favorites-empty")
        svg-icon(iconName="favorites-empty" iconWidth="42px" iconColor="white")
        span(class="panel-static__favorites-empty--title") {{$t('NN0765')}}
        span(class="text-black-5") {{$t('NN0764')}}
    template(v-slot:category-list-rows="{ list, title, isFavorite }")
      category-list-rows(
        :list="list"
        :title="title"
        :isFavorite="isFavorite")
        template(v-slot:action)
          div(class="panel-static__list-rows-action")
            svg-icon(v-if="isFavorite !== undefined" :class="{favorite: isFavorite}"
                    :iconName="isFavorite ? 'favorites-fill' : 'heart'"
                    iconWidth="24px" iconColor="black-5" @click="toggleFaovoritesCategoryByTitle(title)")
            span(@click="item.categorySearch && item.categorySearch(title)") {{$t('NN0082')}}
        template(v-slot:preview="{ item }")
          category-object-item(class="panel-static__item"
            :src="item.src"
            :item="item"
            :style="itemStyles"
            @click4in1="click4in1"
            @dbclick4in1="toggleFavorites4in1"
            @dbclick="toggleFavoritesItem")
    template(v-slot:category-object-item="{ list }")
      div(class="panel-static__items")
        category-object-item(v-for="item in list"
          class="panel-static__item"
          :key="item.id"
          :src="item.src"
          :item="item"
          :style="itemStyles"
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
import CategoryList, { CCategoryList } from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryObjectItem from '@/components/category/CategoryObjectItem.vue'
import Tags, { ITag } from '@/components/global/Tags.vue'
import SearchBar from '@/components/SearchBar.vue'
import i18n from '@/i18n'
import { ICategoryItem, ICategoryList, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import { IAsset, ICategoryExtend, isICategory, isITag, ITagExtend } from '@/interfaces/module'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'

type refTarget = 'mainContent' | 'searchResult' | 'favoritesContent' | 'favoritesSearchResult'

export default defineComponent({
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
      },
      tagScrollLeft: 0,
      isSearchBarExpanded: false,
    }
  },
  computed: {
    ...mapGetters({
      isTabInCategory: 'vivisticker/getIsInCategory',
      isTabShowAllRecently: 'vivisticker/getShowAllRecently'
    }),
    ...mapState({
      isTablet: 'isTablet'
    }),
    ...mapState('objects', {
      rawCategories: 'categories',
      rawContent: 'content',
      rawSearchResult: 'searchResult',
      keyword: 'keyword',
      rawPending: 'pending'
    }),
    ...mapGetters('objects', {
      tagsBar: 'tagsBar',
      favoritesTagsBar: 'favoritesTagsBar',
      favoritesItems: 'favoritesItems',
      favoritesCategories: 'favoritesCategories',
      favoritesTags: 'favoritesTags',
      rawFavoritesSearchResult: 'favoritesSearchResult',
      checkCategoryFavorite: 'checkCategoryFavorite',
      checkTagFavorite: 'checkTagFavorite'
    }),
    isInCategory(): boolean {
      return this.isTabInCategory('object')
    },
    showSearchBar(): boolean {
      return !this.isInCategory && !this.showFav
    },
    showAllRecently(): boolean {
      return this.isTabShowAllRecently('object')
    },
    pending(): boolean {
      if (this.showFav) return this.rawPending.favorites
      if (this.showAllRecently) return this.rawPending.recently
      if (this.isInCategory) return this.rawPending.content
      return this.rawPending.categories || this.rawPending.content
    },
    keywordLabel(): string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    keywordIsFavaorites(): boolean|undefined {
      return this.keywordLabel === '' ? undefined
        : this.checkTagFavorite(this.keywordLabel)
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
            size: this.itemHeight + 10,
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
    favoritesContent(): ICategoryItem[] {
      let result = [] as ICategoryItem[];
      [{ title: i18n.global.tc('NN0762'), list: this.favoritesItems },
        { title: i18n.global.tc('NN0761'), list: this.favoritesTags },
        { title: i18n.global.tc('NN0760'), list: this.favoritesCategories }].forEach(({ title, list }) => {
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
        return `${i18n.global.t('NN0393', {
          keyword: this.keywordLabel,
          target: i18n.global.tc('NN0003', 1)
        })}`
      } else return ''
    },
    tags(): ITag[] {
      return this.showAllRecently ? []
        : this.showFav ? this.favoritesTagsBar : this.tagsBar
    },
    itemHeight(): number {
      return this.isTablet ? 120 : 80
    },
    itemStyles() {
      return {
        width: this.itemHeight + 'px',
        height: this.itemHeight + 'px'
      }
    }
  },
  mounted() {
    generalUtils.panelInit('object',
      this.handleSearch,
      this.handleCategorySearch,
      async ({ reset }: {reset: boolean}) => {
        await this.getRecAndCate({ reset, key: 'objects' })
        this.initFavorites()
      }
    )
  },
  activated() {
    this.$nextTick(() => {
      const ref = this.$refs as Record<string, CCategoryList[]>
      for (const name of this.targets) {
        ref[name][0].$el.scrollTop = this.scrollTop[name]
        ref[name][0].$el.addEventListener('scroll', (e: Event) => this.handleScrollTop(e, name))
      }
    })
  },
  deactivated() {
    if (!this.keyword) this.isSearchBarExpanded = false
  },
  watch: {
    keyword(newVal: string) {
      if (!newVal) {
        this.$nextTick(() => {
          // Will recover scrollTop if do search => switch to other panel => switch back => cancel search.
          (this.$refs.mainContent as CCategoryList[])[0].$el.scrollTop = this.scrollTop.mainContent
        })
      }
    },
    categoryListArray() {
      this.$nextTick(() => {
        const ref = this.$refs as Record<string, CCategoryList[]>
        for (const name of this.targets) {
          ref[name][0].$el.scrollTop = this.scrollTop[name]
        }
      })
    }
  },
  methods: {
    ...mapActions('objects', [
      'getContent',
      'getTagContent',
      'getRecently',
      'getRecAndCate',
      'getMoreContent',
      'resetSearch',
      // favorites actions
      'initFavorites',
      'toggleFavorite',
      'searchFavorites',
      'searchMoreFavorites',
      'searchTagInFavoritesCategory'
    ]),
    // Used by PanelObject.vue
    // eslint-disable-next-line vue/no-unused-properties
    scrollToTop() {
      for (const list of this.categoryListArray) {
        if (list.show) {
          const categoryList = (this.$refs[list.key] as CCategoryList[])[0]
          const top = categoryList.$el.querySelector('.panel-static__top-item') as HTMLElement
          top.scrollIntoView({ behavior: 'smooth' })
        }
      }
    },
    async handleSearch(keyword: string) {
      if (this.showFav) {
        this.searchTagInFavoritesCategory(keyword)
      } else {
        this.resetSearch({ keepSearchResult: true })
        if (keyword) {
          this.getTagContent({ keyword })
          this.isSearchBarExpanded = true
        }
      }
    },
    async handleCategorySearch(keyword: string, locale = '') {
      if (this.showFav) this.searchFavorites(keyword)
      else {
        this.resetSearch()
        if (!keyword) {
          vivistickerUtils.setShowAllRecently('object', false)
          return
        }

        const isRecent = keyword === `${this.$t('NN0024')}`
        if (!isRecent) this.getContent({ keyword, locale })
        vivistickerUtils.setShowAllRecently('object', isRecent)
      }
      vivistickerUtils.setIsInCategory('object', true)
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    click4in1(target: unknown) {
      this.searchFavorites(target)
      vivistickerUtils.setIsInCategory('object', true)
    },
    toggleFavorites4in1(target: ITagExtend | ICategoryExtend) {
      if (isITag(target)) {
        this.toggleFavorite({ tags: target })
      } else if (isICategory(target)) {
        this.toggleFavorite({ categories: target })
      }
    },
    toggleFavoritesItem(target: IAsset) {
      this.toggleFavorite({ items: target })
    },
    toggleFavoritesTag() {
      this.toggleFavorite({ tags: { keyword: this.keywordLabel, active: false } })
    },
    toggleFaovoritesCategoryByTitle(title: string) {
      for (const category of this.rawCategories as IListServiceContentData[]) {
        if (category.title === title) {
          this.toggleFavorite({ categories: { id: category.id, title } })
          return
        }
      }
    },
    handleScrollTop(event: Event, key: refTarget) {
      this.scrollTop[key] = (event.target as HTMLElement).scrollTop
    },
    processListCategory(list: IListServiceContentData[]): ICategoryItem[] {
      const titleHeight = 46
      const gap = this.isTablet ? 20 : 14
      return list
        .filter(category => category.list.length > 0)
        .map((category, index) => ({
          size: this.itemHeight + titleHeight + gap,
          id: `rows_${index}_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.is_recent ? category.list.slice(0, 10) : category.list,
          title: category.title,
          isFavorite: category.id === -1 || category.is_recent ? undefined
            : this.checkCategoryFavorite(category.id)
        }))
    },
    processListResult(list = [] as IListServiceContentDataItem[]|ITagExtend[]): ICategoryItem[] {
      const gap = this.isTablet ? 20 : 24
      return new Array(Math.ceil(list.length / 3))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 3, idx * 3 + 3)
          return {
            id: `result_${rowItems.map(item => isITag(item) ? item.keyword : item.id).join('_')}`,
            type: 'category-object-item',
            list: rowItems as IAsset[],
            size: this.itemHeight + gap
          }
        })
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-static {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  color: setColor(white);
  overflow: hidden;
  &__tags {
    margin-top: 14px;
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
  &.with-search-bar {
    height: calc(100% + 56px); // 42px (serach bar height) + 14px (margin-top of tags) = 56px
    .panel-static__tags {
      clip-path: inset(0 0 0 0);
      transition: transform 200ms 100ms ease-in-out, clip-path 200ms 100ms ease-in-out;
      &.collapsed {
        transform: translateY(-56px);
        clip-path: inset(0 42px 0 0);
      }
    }
    .category-list {
      transition: transform 200ms 100ms ease-in-out;
      &.collapsed{
        transform: translateY(-56px) translateZ(0);
      }
    }
    &::v-deep .vue-recycle-scroller__item-wrapper {
      margin-bottom: 56px;
    }
    &::v-deep .tags__flex-container-mobile {
      width: max-content;
      margin-right: 42px;
    }
  }
  &.in-category::v-deep .vue-recycle-scroller__item-wrapper {
    margin-top: 24px;
  }
  &__list-rows-action {
    display: flex;
    align-items: center;
    > svg {
      transition: none;
      margin-right: 20px;
      padding-right: 20px;
      border-right: 1px solid setColor(gray-2);
      &.favorite {
        color: #FC5757;
      }
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
  .invisible {
    visibility: hidden;
    height: 0;
    overflow: hidden;
  }
}
</style>
