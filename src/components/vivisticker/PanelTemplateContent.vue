<template lang="pug">
div(class="panel-template-content" ref="panel" :class="{'in-category': isInCategory, 'with-search-bar': showSearchBar}")
  //- Group template UI
  panel-group-template(v-if="currentGroup"
    :groupItem="currentGroup"
    @close="currentGroup = null")
  //- Search bar
  search-bar(v-if="showSearchBar"
    class="panel-template-content__searchbar"
    :placeholder="$t('NN0092', { target: $tc('NN0001', 1) })"
    clear
    :defaultKeyword="keywordLabel"
    vivisticker="dark"
    :color="{close: 'black-5', search: 'black-5'}"
    v-model:expanded="isSearchBarExpanded"
    @search="handleSearch"
    @scroll="(scrollLeft: number) => tagScrollLeft = scrollLeft")
  tags(v-if="tags && tags.length"
      class="panel-template-content__tags"
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
      div(class="panel-template-content__top-item")
    template(v-slot:category-list-rows="{ list, title }")
      category-list-rows(:list="list" :title="title" :columnGap="12"
        @action="handleCategorySearch")
        template(v-slot:preview="{ item }")
          component(class="panel-template-content__item"
            :is="item.content_ids && item.content_ids.length > 1 ? 'category-group-template-item' : 'category-template-item'"
            :item="item"
            :style="itemStyles"
            @clickGroupItem="handleShowGroup")
    template(v-slot:category-template-item="{ list, title }")
      div(v-if="title" class="panel-template-content__header") {{ title }}
      div(class="panel-template-content__items")
        component(v-for="item in list"
          class="panel-template-content__item"
          :is="item.content_ids && item.content_ids.length > 1 ? 'category-group-template-item' : 'category-template-item'"
          :item="item"
          :key="item.group_id"
          :style="itemStyles"
          @clickGroupItem="handleShowGroup")
    template(#after)
      //- Loading icon
      div(v-if="pending" class="text-center")
        svg-icon(iconName="loading"
          iconColor="white"
          iconWidth="20px")
  btn-add(v-if="!isInCategory" :elScrollable="elMainContent" :text="'Create ' + igLayout" @click="addTemplate")
</template>

<script lang="ts">
import CategoryGroupTemplateItem from '@/components/category/CategoryGroupTemplateItem.vue'
import CategoryList, { CCategoryList } from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryTemplateItem from '@/components/category/CategoryTemplateItem.vue'
import Tags, { ITag } from '@/components/global/Tags.vue'
import Url from '@/components/global/Url.vue'
import SearchBar from '@/components/SearchBar.vue'
import BtnAdd from '@/components/vivisticker/BtnAdd.vue'
import PanelGroupTemplate from '@/components/vivisticker/PanelGroupTemplate.vue'
import { IAssetTemplate, ICategoryItem, ICategoryList, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import editorUtils from '@/utils/editorUtils'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { round } from 'lodash'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  name: 'panel-template-content',
  components: {
    SearchBar,
    CategoryList,
    CategoryListRows,
    CategoryTemplateItem,
    CategoryGroupTemplateItem,
    PanelGroupTemplate,
    Url,
    Tags,
    BtnAdd
  },
  props: {
    igLayout: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      currentGroup: null as IListServiceContentDataItem | null,
      scrollTop: {
        mainContent: 0,
        searchResult: 0
      },
      tagScrollLeft: 0,
      isSearchBarExpanded: false,
      elMainContent: undefined as HTMLElement | undefined
    }
  },
  mounted() {
    eventUtils.on(PanelEvent.scrollPanelObjectToTop, this.scrollToTop)
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
  activated() {
    this.setIgLayout(this.igLayout)
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
    }
  },
  computed: {
    ...mapState({
      isTablet: 'isTablet'
    }),
    ...mapState('user', ['userId']),
    ...mapGetters({
      editorThemes: 'getEditThemes',
      isTabInCategory: 'vivisticker/getIsInCategory',
      isTabShowAllRecently: 'vivisticker/getShowAllRecently'
    }),
    categories() {
      return this.$store.state.templates[this.igLayout].categories
    },
    rawContent() {
      return this.$store.state.templates[this.igLayout].content
    },
    rawSearchResult() {
      return this.$store.state.templates[this.igLayout].searchResult
    },
    keyword() {
      return this.$store.state.templates[this.igLayout].keyword
    },
    pending() {
      return this.$store.getters[`templates/${this.igLayout}/pending`]
    },
    tagsBar() {
      return this.$store.getters[`templates/${this.igLayout}/tagsBar`]
    },
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
      return this.igLayout === 'story' ? round(this.itemWidth / 9 * 16) : this.itemWidth
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
    ...mapMutations('templates', { setIgLayout: 'SET_igLayout' }),
    getRecAndCate(params = {}) {
      this.$store.dispatch(`templates/${this.igLayout}/getRecAndCate`, params)
    },
    getContent(params = {}) {
      this.$store.dispatch(`templates/${this.igLayout}/getContent`, params)
    },
    getTagContent(params = {}) {
      this.$store.dispatch(`templates/${this.igLayout}/getTagContent`, params)
    },
    getMoreContent() {
      this.$store.dispatch(`templates/${this.igLayout}/getMoreContent`)
    },
    resetSearch(params = {}) {
      this.$store.dispatch(`templates/${this.igLayout}/resetSearch`, params)
    },
    scrollToTop() {
      for (const list of this.categoryListArray) {
        if (list.show) {
          const categoryList = (this.$refs[list.key] as CCategoryList[])[0]
          const top = categoryList.$el.querySelector('.panel-template-content__top-item') as HTMLElement
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
    },
    addTemplate() {
      editorUtils.setCurrActivePanel('add-template')
      editorUtils.setShowMobilePanel(true)
    },
  }
})
</script>

<style lang="scss" scoped>
.panel-template-content {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  color: white;
  text-align: left;
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
    .panel-template-content__tags {
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
