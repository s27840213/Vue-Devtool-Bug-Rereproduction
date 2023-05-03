<template lang="pug">
div(class="panel-template rwd-container" :class="{'in-category': isInCategory, 'with-search-bar': showSearchBar}")
  tabs(v-if="!isInCategory"
      class="panel-template__tabs"
      :tabs="['Story', 'Post']"
      v-model="tabIndex")
  div(class="panel-template__content" ref="panel")
    //- Group template UI
    panel-group-template(v-if="currentGroup"
      :groupItem="currentGroup"
      @close="currentGroup = null")
    //- Search bar
    search-bar(v-if="showSearchBar"
      class="panel-template__searchbar"
      :placeholder="$t('NN0092', { target: $tc('NN0001', 1) })"
      clear
      :defaultKeyword="keywordLabel"
      vivisticker="dark"
      :color="{close: 'black-5', search: 'black-5'}"
      v-model:expanded="isSearchBarExpanded"
      @search="handleSearch"
      @scroll="(scrollLeft: number) => tagScrollLeft = scrollLeft")
    tags(v-if="tags && tags.length"
        class="panel-template__tags"
        :class="{collapsed: !isSearchBarExpanded}"
        :tags="tags"
        theme="dark"
        @search="handleSearch")
    //- Search result and main content
    category-list(v-for="item in categoryListArray"
                  :class="{invisible: !item.show, collapsed: !isSearchBarExpanded}"
                  v-show="item.show" :ref="item.key" :key="item.key"
                  :list="item.content" @loadMore="handleLoadMore"
                  @scroll.passive="handleScrollTop($event, item.key as 'mainContent'|'searchResult')")
      template(#before)
        div(class="panel-template__top-item")
      template(v-slot:category-list-rows="{ list, title }")
        category-list-rows(:list="list" :title="title" :columnGap="12"
          @action="handleCategorySearch")
          template(v-slot:preview="{ item }")
            component(class="panel-template__item"
              :is="item.content_ids && item.content_ids.length > 1 ? 'category-group-template-item' : 'category-template-item'"
              :item="item"
              :style="itemStyles"
              @clickGroupItem="handleShowGroup")
      template(v-slot:category-template-item="{ list, title }")
        div(v-if="title" class="panel-template__header") {{ title }}
        div(class="panel-template__items")
          component(v-for="item in list"
            class="panel-template__item"
            :is="item.content_ids && item.content_ids.length > 1 ? 'category-group-template-item' : 'category-template-item'"
            :item="item"
            :key="item.group_id"
            :style="itemStyles"
            @clickGroupItem="handleShowGroup")
      template(#after)
        //- Loading icon
        div(v-if="!theme || pending" class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
    btn-add(:elScrollable="elMainContent" :text="'Create ' + (theme === '2' ? 'Post' : 'Story')")
</template>

<script lang="ts">
import CategoryGroupTemplateItem from '@/components/category/CategoryGroupTemplateItem.vue'
import CategoryList, { CCategoryList } from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryTemplateItem from '@/components/category/CategoryTemplateItem.vue'
import Tags, { ITag } from '@/components/global/Tags.vue'
import Url from '@/components/global/Url.vue'
import PopupTheme from '@/components/popup/PopupTheme.vue'
import SearchBar from '@/components/SearchBar.vue'
import Tabs from '@/components/Tabs.vue'
import BtnAdd from '@/components/vivisticker/BtnAdd.vue'
import PanelGroupTemplate from '@/components/vivisticker/PanelGroupTemplate.vue'
import { IAssetTemplate, ICategoryItem, ICategoryList, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { round } from 'lodash'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  name: 'panel-template',
  components: {
    Tabs,
    SearchBar,
    CategoryList,
    CategoryListRows,
    CategoryTemplateItem,
    PopupTheme,
    CategoryGroupTemplateItem,
    PanelGroupTemplate,
    Url,
    Tags,
    BtnAdd
  },
  data() {
    return {
      tabIndex: 0,
      currentGroup: null as IListServiceContentDataItem | null,
      scrollTop: {
        mainContent: 0,
        searchResult: 0
      },
      tagScrollLeft: 0,
      isSearchBarExpanded: false,
      elMainContent: undefined as HTMLElement | undefined,
    }
  },
  mounted() {
    eventUtils.on(PanelEvent.scrollPanelObjectToTop, this.scrollToTop)
    this._setTemplateState({ theme: '3' })
    generalUtils.panelInit('template',
      this.handleSearch,
      this.handleCategorySearch,
      this.getRecAndCate
    )
    this.elMainContent = (this.$refs as Record<string, CCategoryList[]>).mainContent[0].$el as HTMLElement
  },
  beforeUnmount() {
    eventUtils.off(PanelEvent.scrollPanelObjectToTop)
  },
  watch: {
    keyword(newVal: string) {
      if (!newVal) {
        this.$nextTick(() => {
          // Will recover scrollTop if do search => switch to other panel => switch back => cancel search.
          const mainContent = (this.$refs.mainContent as CCategoryList[])[0]
          mainContent.$el.scrollTop = this.scrollTop.mainContent
        })
      }
    },
    tabIndex(newVal: number) {
      if (newVal === 0) this.handleTheme({ 3: true })
      else if (newVal === 1) this.handleTheme({ 2: true })
    }
  },
  computed: {
    ...mapState({
      isTablet: 'isTablet'
    }),
    ...mapState('user', ['userId']),
    ...mapState('templates', {
      categories: 'categories',
      rawContent: 'content',
      rawSearchResult: 'searchResult',
      keyword: 'keyword',
      theme: 'theme',
      sum: 'sum'
    }),
    ...mapGetters({
      editorThemes: 'getEditThemes',
      isTabInCategory: 'vivisticker/getIsInCategory',
      isTabShowAllRecently: 'vivisticker/getShowAllRecently'
    }),
    ...mapGetters('templates', {
      pending: 'pending',
      tagsBar: 'tagsBar'
    }),
    isInCategory(): boolean {
      return this.isTabInCategory('template')
    },
    showSearchBar(): boolean {
      return !this.isInCategory
    },
    showAllRecently(): boolean {
      return this.isTabShowAllRecently('object')
    },
    keywordLabel(): string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    itemWidth(): number {
      return this.isTablet ? 120 : 100
    },
    itemHeight(): number {
      return this.tabIndex === 0 ? round(this.itemWidth / 9 * 16) : this.itemWidth
    },
    listCategories(): ICategoryItem[] {
      const { categories, itemHeight } = this
      return (categories as IListServiceContentData[])
        .filter(category => category.list.length > 0)
        .map((category, index) => ({
          size: itemHeight + 46,
          id: `rows_${index}_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
    },
    listResult(): ICategoryItem[] {
      return this.processListResult(this.rawContent.list, false)
    },
    searchResult(): ICategoryItem[] {
      const list = this.processListResult(this.rawSearchResult.list, true)
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
    itemStyles(): {[key: string]: string} {
      return {
        width: this.itemWidth + 'px',
        height: this.itemHeight + 'px'
      }
    },
    tags(): ITag[] {
      return this.showAllRecently ? [] : this.tagsBar
    },
  },
  methods: {
    ...mapActions('templates', [
      'getRecAndCate',
      'getContent',
      'getTagContent',
      'getMoreContent',
      'resetSearch',
      'resetContent',
      'getSum'
    ]),
    ...mapMutations('templates', {
      _setTemplateState: 'SET_STATE'
    }),
    scrollToTop() {
      for (const list of this.categoryListArray) {
        if (list.show) {
          const categoryList = (this.$refs[list.key] as CCategoryList[])[0]
          const top = categoryList.$el.querySelector('.panel-template__top-item') as HTMLElement
          top.scrollIntoView({ behavior: 'smooth' })
        }
      }
    },
    async handleSearch(keyword?: string) {
      this.resetSearch({ keepSearchResult: true })
      if (keyword) {
        await this.getTagContent({ keyword })
        this.isSearchBarExpanded = true
      }
    },
    async handleCategorySearch(keyword: string, locale = '') {
      this.resetSearch()
      if (keyword) {
        if (keyword === `${this.$t('NN0024')}`) {
          vivistickerUtils.setShowAllRecently('template', true)
        } else {
          this.getContent({ keyword, locale })
        }
        vivistickerUtils.setIsInCategory('template', true)
      } else {
        vivistickerUtils.setShowAllRecently('template', false)
      }
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    handleShowGroup(group: IListServiceContentDataItem) {
      this.currentGroup = group
    },
    async handleTheme(selected: { [key: string]: boolean }) {
      this.resetSearch()
      const theme = Object
        .entries(selected)
        .reduce((prev, [id, checked]) => {
          checked && prev.push(id)
          return prev
        }, [] as string[])
        .join(',')
      const oldKeyword = this.keyword as string
      this._setTemplateState({ theme })
      this.resetContent()
      if (oldKeyword.startsWith('tag::')) await this.handleSearch(oldKeyword)
      else if (oldKeyword) await this.handleCategorySearch(oldKeyword)
      this.getRecAndCate({ reset: false })
    },
    handleScrollTop(event: Event, key: 'mainContent'|'searchResult') {
      this.scrollTop[key] = (event.target as HTMLElement).scrollTop
    },
    processListResult(list = [] as IAssetTemplate[], isSearch: boolean): ICategoryItem[] {
      const titleHeight = 46
      const gap = 20
      return new Array(Math.ceil(list.length / 3))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 3, idx * 3 + 3)
          const title = !isSearch && !idx ? `${this.$t('NN0083')}` : ''
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-template-item',
            list: rowItems as unknown as IListServiceContentDataItem[],
            size: this.itemHeight + gap + (title ? titleHeight : 0),
            title
          }
        })
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-template {
  @include size(100%, 100%);
  display: grid;
  grid-template-rows: auto auto 1fr;
  &__tabs {
    margin-top: 24px;
  }
  &__content {
    @include size(100%, 100%);
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    color: white;
    text-align: left;
  }
  &__tags {
    margin-top: 14px;
    color: setColor(black-5);
  }
  &__item {
    text-align: center;
    vertical-align: middle;
    margin: 0 auto;
    >div {
      border-radius: 5px;
      overflow: hidden;
    }
  }
  &__items {
    display: grid;
    column-gap: 20px;
    grid-template-columns: repeat(3, 1fr);
  }
  &.with-search-bar {
    height: calc(100% + 56px); // 42px (serach bar height) + 14px (margin-top of tags) = 56px
    .panel-template__tags {
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
      padding-right: 42px;
    }
  }
  &.in-category::v-deep .vue-recycle-scroller__item-wrapper {
    margin-top: 24px;
  }
  &__header {
    grid-column: 1 / 3;
    line-height: 26px;
    color: #ffffff;
    padding: 10px 0;
    text-align: left;
  }
  &__advanced--active {
    color: setColor(blue-3);
  }
  &__theme {
    position: absolute;
    left: 20px;
    right: 20px;
  }
  &__search {
    position: relative;
    z-index: 2;
  }
  &__wrap {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1;
    background: rgba(0, 0, 0, 0.8);
  }
  &__prompt {
    position: absolute;
    display: flex;
    align-items: center;
    text-align: left;
    left: 10px;
    top: 55px;
    width: 284px;
    padding: 12px 8px;
    line-height: 20px;
    border-radius: 5px;
    background-color: setColor(gray-4);
    z-index: 99;
    filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
    > span {
      width: 255px;
    }
    &:before {
      content: "";
      display: block;
      width: 0;
      height: 0;
      position: absolute;
      right: 20px;
      top: -12px;
      transform: rotate(90deg);
      border-style: solid;
      border-width: 8px 10px 8px 0;
      border-color: transparent setColor(gray-4) transparent transparent;
    }
  }
}
</style>
