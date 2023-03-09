<template lang="pug">
div(class="panel-text rwd-container" :class="{'in-category': isInCategory}")
  category-list(v-for="item in categoryListArray"
    v-show="item.show" :ref="item.key" :key="item.key"
    :list="item.content" @loadMore="handleLoadMore")
    template(#before)
      div(class="panel-text__top-item")
    template(v-if="pending" #after)
      div(class="text-center")
        svg-icon(iconName="loading"
          iconColor="white"
          iconWidth="20px")
          div(class="panel-text__item" :style="itemStyles")
    template(v-slot:category-text-item="{ list }")
      div(class="panel-text__items" :style="itemsStyles")
        div(class="panel-text__item" :class="{recent: item.id === 'recent'}" v-for="item in list" :style="itemStyles(item)")
          div(v-if="item.id === 'recent'" class="panel-text__item__recent"
                @click="handleCategorySearch($t('NN0024'))")
            svg-icon(class="pointer"
              iconName="clock"
              iconColor="balck-1"
              iconWidth="24px")
            div(class="overline-SM") {{ "RECENTLY USED" }}
          category-text-item(v-else class="panel-text__item__text"
            :key="item.id"
            :item="item"
            style="width: 100%; height: 100%;")
  div(v-if="!showAllRecently" class="panel-text__text-button-wrapper"
      :style="`font-family: ${localeFont()}`"
      @click="handleAddText")
    span {{ $t('STK0001') }}
    svg-icon(iconName="plus-square" iconWidth="22px" iconColor="white")
</template>

<script lang="ts">
import CategoryList, { CCategoryList } from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryTextItem from '@/components/category/CategoryTextItem.vue'
import SearchBar from '@/components/SearchBar.vue'
import i18n from '@/i18n'
import { ICategoryItem, ICategoryList, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import AssetUtils from '@/utils/assetUtils'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import VueI18n from 'vue-i18n'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  name: 'panel-text-us',
  components: {
    SearchBar,
    CategoryList,
    CategoryListRows,
    CategoryTextItem
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
      scaleRatio: 'getPageScaleRatio',
      getLayersNum: 'getLayersNum',
      isInEditor: 'vivisticker/getIsInEditor',
      isTabInCategory: 'vivisticker/getIsInCategory',
      isTabShowAllRecently: 'vivisticker/getShowAllRecently',
      editorBg: 'vivisticker/getEditorBg'
    }),
    ...mapState({
      isTablet: 'isTablet'
    }),
    ...mapState('textStock', {
      categories: 'categories',
      rawContent: 'content',
      rawSearchResult: 'searchResult',
      pending: 'pending',
      keyword: 'keyword'
    }),
    isInCategory(): boolean {
      return this.isTabInCategory('text')
    },
    showAllRecently(): boolean {
      return this.isTabShowAllRecently('text')
    },
    keywordLabel(): string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    listDefaultText(): { type: string, text: VueI18n.TranslateResult }[] {
      return [{
        type: 'Heading',
        text: this.$t('NN0011')
      }, {
        type: 'Subheading',
        text: this.$t('NN0012')
      }, {
        type: 'Body',
        text: this.$t('NN0013')
      }]
    },
    listCategories(): ICategoryItem[] {
      const titleHeight = 46
      const gap = this.isTablet ? 20 : 14
      const { categories } = this
      return (categories as IListServiceContentData[])
        .filter(category => category.list.length > 0)
        .map((category, index) => ({
          size: 80 + titleHeight + gap,
          id: `rows_${index}_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.is_recent ? category.list.slice(0, 10) : category.list,
          title: category.title
        }))
    },
    listRecently(): ICategoryItem[] {
      const { categories } = this
      const gap = 20
      const list = (categories as IListServiceContentData[]).find(category => category.is_recent)?.list ?? []
      const result = new Array(Math.ceil(list.length / this.textColumns))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * this.textColumns, idx * this.textColumns + this.textColumns)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-text-item',
            list: rowItems,
            size: this.itemWidth + gap,
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
    mainContent(): ICategoryItem[] {
      if (this.showAllRecently) {
        return this.listRecently
      }
      const list = this.listResult
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
      return `${i18n.global.t('NN0393', {
          keyword: this.keywordLabel,
          target: i18n.global.tc('NN0005', 1)
        })}`
    },
    itemWidth(): number {
      return this.isTablet ? 200 : (window.outerWidth - 48 - (this.textColumns - 1) * 20) / this.textColumns
    },
    itemsStyles() {
      return this.isTablet ? {
        gridTemplateColumns: `repeat(${this.textColumns}, 200px)`,
        justifyContent: 'space-around'
      } : {
        gridTemplateColumns: `repeat(${this.textColumns}, 1fr)`,
        columnGap: '20px'
      }
    },
    textColumns(): number {
      return this.isTablet ? 3 : 2
    },
  },
  mounted() {
    if (this.categories.length !== 0 || this.rawContent.list || this.rawSearchResult.list || this.pending) return
    generalUtils.panelInit('text',
      this.handleSearch,
      this.handleCategorySearch,
      async ({ reset }: {reset: boolean}) => {
        await this.getRecently({ writeBack: true })
        await this.getContent()
      })
    eventUtils.on(PanelEvent.scrollPanelTextToTop, this.scrollToTop)
  },
  beforeUnmount() {
    eventUtils.off(PanelEvent.scrollPanelTextToTop)
  },
  activated() {
    this.$nextTick(() => {
      const mainContent = (this.$refs.mainContent as CCategoryList[])[0].$el
      const searchResult = (this.$refs.searchResult as CCategoryList[])[0].$el
      mainContent.scrollTop = this.scrollTop.mainContent
      searchResult.scrollTop = this.scrollTop.searchResult
      mainContent.addEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'mainContent'))
      searchResult.addEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'searchResult'))
    })
  },
  watch: {
    keyword(newVal: string) {
      if (!newVal) {
        this.$nextTick(() => {
          const mainContent = (this.$refs.mainContent as CCategoryList[])[0].$el
          // Will recover scrollTop if do search => switch to other panel => switch back => cancel search.
          mainContent.scrollTop = this.scrollTop.mainContent
        })
      }
    }
  },
  methods: {
    ...mapActions('textStock', [
      'getContent',
      'getTagContent',
      'getRecently',
      'getRecAndCate',
      'getMoreContent',
      'resetSearch'
    ]),
    ...mapMutations({
      setSettingsOpen: 'brandkit/SET_isSettingsOpen'
    }),
    scrollToTop() {
      for (const list of this.categoryListArray) {
        if (list.show) {
          const categoryList = (this.$refs[list.key] as CCategoryList[])[0]
          const top = categoryList.$el.querySelector('.panel-text__top-item') as HTMLElement
          top.scrollIntoView({ behavior: 'smooth' })
        }
      }
    },
    async handleSearch(keyword: string) {
      this.resetSearch()
      if (keyword) {
        this.getTagContent({ keyword })
      }
    },
    async handleCategorySearch(keyword: string, locale = '') {
      this.resetSearch()
      if (keyword) {
        if (keyword === `${this.$t('NN0024')}`) {
          vivistickerUtils.setShowAllRecently('text', true)
        } else {
          this.getContent({ keyword, locale })
        }
        vivistickerUtils.setIsInCategory('text', true)
      }
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    async addStandardText() {
      let recentFont
      if (vivistickerUtils.checkVersion('1.5')) {
        recentFont = await vivistickerUtils.getState('recentFont')
      }
      const color = vivistickerUtils.getContrastColor(this.editorBg)
      await AssetUtils.addStandardText('body', `${this.$t('NN0494')}`, i18n.global.locale, undefined, undefined, {
        size: 21,
        color,
        weight: 'normal',
        ...(recentFont ?? {})
      })
    },
    handleAddText() {
      if (this.isInEditor) {
        this.addStandardText()
      } else {
        vivistickerUtils.startEditing(
          'text',
          { plan: 0, assetId: '' },
          async () => {
            console.log('start editing standard text')
            await this.addStandardText()
            return true
          },
          vivistickerUtils.getEmptyCallback()
        )
      }
    },
    localeFont() {
      return AssetUtils.getFontMap()[i18n.global.locale]
    },
    handleScrollTop(event: Event, key: 'mainContent'|'searchResult') {
      this.scrollTop[key] = (event.target as HTMLElement).scrollTop
    },
    processListResult(list = [] as IListServiceContentDataItem[], isSearch: boolean): ICategoryItem[] {
      const gap = 20
      const recentItem = {
        id: 'recent',
        type: NaN,
        ver: NaN
      } as IListServiceContentDataItem
      if (list.length > 0) list = [recentItem].concat(list)
      return new Array(Math.ceil(list.length / this.textColumns))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * this.textColumns, (idx + 1) * this.textColumns)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-text-item',
            list: rowItems,
            title: '',
            size: this.itemWidth + gap // 80(object height) + 24(gap) + 0/46(title)
          }
        })
    },
    itemStyles(item: IListServiceContentDataItem) {
      return {
        width: this.itemWidth + 'px',
        height: this.itemWidth + 'px',
        background: item.id === 'recent' ? 'setColor(light-bg)' : 'magenta',
        ...(!this.isTablet && { margin: '0 auto' })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.search-bar {
  flex: 0 0 auto;
}
.panel-text {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  transform: rotate(0deg);
  padding-top: 10px;
  &__searchbar {
    margin-top: 24px;
    margin-bottom: 14px;
    &.no-top {
      margin-top: 0;
    }
  }
  &__brand-header {
    margin-top: 10px;
    margin-bottom: 13px;
  }
  &__brand-settings {
    position: absolute;
    width: 24px;
    height: 24px;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
  }
  &__item {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    overflow: hidden;
    &__text {
      padding: 30px;
      box-sizing: border-box;
    }
    &__recent {
      @include size(100%, 100%);
      display: flex;
      flex-direction: column;
      gap: 14px;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      color: setColor(black-1);
    }
    &.recent {
      background-color: setColor(light-bg);
    }
    // object-fit: contain;
    // vertical-align: middle;
  }
  &__items {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    column-gap: 10px;
  }
  &.in-category::v-deep .vue-recycle-scroller__item-wrapper {
    margin-top: 24px;
  }
  &__header {
    grid-column: 1 / 4;
    line-height: 26px;
    color: #ffffff;
    padding: 10px 0;
    text-align: left;
  }
  &__text-button-wrapper {
    position: fixed;
    left: 50%;
    bottom: 11px;
    width: 255px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 14px 0;
    margin-left: -127.5px;
    box-sizing: border-box;
    background-color: setColor(black-3);
    border-radius: 10px;
    &:active {
      background-color: setColor(black-1-5);
    }
    & > span {
      font-weight: 600;
      font-size: 20px;
      line-height: 28px;
      color: white;
    }
  }
}
</style>
