<template lang="pug">
div(class="panel-template-content" ref="panel" :class="{'in-category': isInCategory, 'in-group-template': isInGroupTemplate, 'with-search-bar': isInMainContent, 'rwd-container': isInEditor}")
  search-bar(v-if="isInMainContent"
    class="panel-template-content__searchbar"
    :placeholder="$t('NN0092', { target: $tc('NN0001', 1) })"
    clear
    :defaultKeyword="keywordLabel"
    vivisticker="dark"
    :color="{close: 'black-5', search: 'black-5'}"
    v-model:expanded="isSearchBarExpanded"
    @search="handleSearch")
  tags(v-show="tags && tags.length"
      class="panel-template-content__tags"
      :class="{collapsed: !isSearchBarExpanded}"
      :tags="tags"
      ref="tags"
      theme="dark"
      @search="handleSearch")
  //- Search result and main content
  category-list(v-for="item in categoryListArray"
                :class="{invisible: !item.show, collapsed: tags && tags.length && !isSearchBarExpanded}"
                :ref="item.key" :key="item.key"
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
          @clickGroupItem="handleShowGroup"
          :groupItem="currentGroup")
    template(#after)
      //- Loading icon
      div(v-if="pending" class="text-center")
        svg-icon(iconName="loading"
          iconColor="white"
          iconWidth="20px")
  btn-add(v-show="!isInCategory && !isInGroupTemplate && !keyword" :elScrollable="elMainContent" :text="strBtnAdd" @click="addTemplate")
  div(v-if="isInGroupTemplate" class="panel-template-content__btn-add-group-template" @click="addGroupTemplate")
    svg-icon(class="panel-template-content__btn-add-group-template__icon"
            iconName="add-page"
            iconColor="gray-2"
            iconWidth="24px")
    span(class="body-SM text-black-3") {{`Add all pages (${currentGroup?.content_ids.length ?? 0} pages)`}}
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
import { IAssetTemplate, ICategoryItem, ICategoryList, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import { IContentTemplate } from '@/interfaces/template'
import assetUtils from '@/utils/assetUtils'
import editorUtils from '@/utils/editorUtils'
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
    Url,
    Tags,
    BtnAdd
  },
  props: {
    initIgLayout: {
      type: String,
      default: 'story'
    }
  },
  data() {
    return {
      targets: ['mainContent', 'searchResult', 'groupContent'],
      currentGroup: null as IAssetTemplate | null,
      scrollTop: {
        mainContent: 0,
        searchResult: 0
      },
      isSearchBarExpanded: false,
      elMainContent: undefined as HTMLElement | undefined
    }
  },
  mounted() {
    generalUtils.panelInit('template',
      this.handleSearch,
      this.handleCategorySearch,
      async ({ reset }: {reset: boolean}) => {
        await this.getRecAndCate({ reset, key: `templates/${this.igLayout}` })
      }
    )
    this.elMainContent = (this.$refs as Record<string, CCategoryList[]>).mainContent[0].$el as HTMLElement
  },
  activated() {
    this.setIgLayout(this.igLayout)
  },
  unmounted() {
    this.setIsInGroupTemplate(false)
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
    isInMainContent() {
      // skip transitions when entering of leaving main content
      this.toggleTransitions(false)
      window.requestAnimationFrame(() => {
        this.toggleTransitions(true)
      })
    },
    isInGroupTemplate(newVal) {
      if (!newVal) this.currentGroup = null
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
      isInGroupTemplate: 'vivisticker/getIsInGroupTemplate',
      isTabShowAllRecently: 'vivisticker/getShowAllRecently',
      isInEditor: 'vivisticker/getIsInEditor',
      editorType: 'vivisticker/getEditorType',
      editorTypeTemplate: 'vivisticker/getEditorTypeTemplate',
    }),
    igLayout() {
      return this.editorTypeTemplate ? this.editorType : this.initIgLayout
    },
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
    isInMainContent(): boolean {
      return !this.isInCategory && !this.isInGroupTemplate
    },
    showAllRecently(): boolean {
      return this.isTabShowAllRecently('template')
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
    listRecently(): ICategoryItem[] {
      const { categories } = this
      const list = (categories as IListServiceContentData[]).find(category => category.is_recent)?.list ?? []
      const result = new Array(Math.ceil(list.length / 3))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 3, idx * 3 + 3)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-template-item',
            list: rowItems,
            size: this.itemHeight + 20,
            title: ''
          }
        })
      return result
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
    groupContent(): ICategoryItem[] {
      if (this.currentGroup === null) return []
      return this.processListResult(this.currentGroup.content_ids.map(content => ({ ...content, type: 6 })), true)
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
        show: this.keyword && !this.isInGroupTemplate,
        key: 'searchResult'
      }, {
        content: this.groupContent,
        show: this.isInGroupTemplate,
        key: 'groupContent'
      }, {
        content: this.mainContent,
        show: !this.keyword && !this.isInGroupTemplate,
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
      return this.showAllRecently || this.isInGroupTemplate ? [] : this.tagsBar
    },
    strBtnAdd(): string {
      return this.$t('STK0064', { type: this.igLayout === 'post' ? this.$t('STK0063') : this.$t('STK0005') })
    }
  },
  methods: {
    ...mapMutations('vivisticker', { setIsInGroupTemplate: 'SET_isInGroupTemplate' }),
    ...mapMutations('templates', { setIgLayout: 'SET_igLayout' }),
    async getRecAndCate(params = {}) {
      await this.$store.dispatch(`templates/${this.igLayout}/getRecAndCate`, params)
    },
    getContent(params = {}) {
      this.$store.dispatch(`templates/${this.igLayout}/getContent`, params)
    },
    async getTagContent(params = {}) {
      await this.$store.dispatch(`templates/${this.igLayout}/getTagContent`, params)
    },
    getMoreContent() {
      this.$store.dispatch(`templates/${this.igLayout}/getMoreContent`)
    },
    resetSearch(params = {}) {
      this.$store.dispatch(`templates/${this.igLayout}/resetSearch`, params)
    },
    // Used by PanelTemplate.vue
    // eslint-disable-next-line vue/no-unused-properties
    scrollToTop() {
      for (const list of this.categoryListArray) {
        if (list.show) {
          const categoryList = (this.$refs[list.key] as CCategoryList[])[0]
          const top = categoryList.$el.querySelector('.panel-template-content__top-item') as HTMLElement
          top.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
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
    handleShowGroup(group: IAssetTemplate) {
      this.currentGroup = group
      this.setIsInGroupTemplate(true)
    },
    handleScrollTop(event: Event, key: 'mainContent'|'searchResult') {
      this.scrollTop[key] = (event.target as HTMLElement).scrollTop
    },
    processListResult(list = [] as IAssetTemplate[] | IContentTemplate[], isSearch: boolean): ICategoryItem[] {
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
    addGroupTemplate() {
      if (!this.currentGroup) return
      if (!vivistickerUtils.checkPro(this.currentGroup, 'template')) return
      const cb = async () => {
        await assetUtils.addGroupTemplate(this.currentGroup as any, undefined, vivistickerUtils.getPageSize(this.igLayout), `templates/${this.igLayout}`)
        return true
      }
      if (this.isInEditor) {
        cb()
      } else {
        vivistickerUtils.startEditing(
          this.igLayout, {
            plan: this.currentGroup.plan,
            assetId: this.currentGroup.id
          }, cb, vivistickerUtils.getAssetCallback(this.currentGroup as any)
        )
      }
    },
    toggleTransitions(enable: boolean) {
      // tags
      const elTags = (this.$refs.tags as any)?.$el as HTMLElement
      if (elTags) elTags.style.transition = enable ? '' : 'none'

      // category list
      const ref = this.$refs as Record<string, CCategoryList[]>
      for (const name of this.targets) {
        ref[name][0].$el.style.transition = enable ? '' : 'none'
      }
    }
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
  &.in-category, &.in-group-template::v-deep .vue-recycle-scroller__item-wrapper {
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
  &__btn-add-group-template {
    position: absolute;
    right: 40px;
    left: 40px;
    bottom: 24px;
    width: min-content;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 9px 16px;
    margin: 0 auto;
    box-sizing: border-box;
    background: white;
    border-radius: 10px;
    overflow: hidden;
    white-space: nowrap;
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
