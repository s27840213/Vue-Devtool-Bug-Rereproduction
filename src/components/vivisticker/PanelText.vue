<template lang="pug">
  div(class="panel-text")
    search-bar(v-if="!isInCategory"
      class="panel-text__searchbar"
      :class="{'no-top': isInEditor}"
      :placeholder="$t('NN0092', {target: $tc('NN0005',1)})"
      clear
      :defaultKeyword="keywordLabel"
      vivisticker="dark"
      :color="{close: 'black-5', search: 'black-5'}"
      @search="handleSearch")
    div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
    template(v-if="!keyword")
      div(class="panel-text__text-button-wrapper"
          :style="`font-family: ${localeFont()}`"
          @click="handleAddText")
        span {{ $t('STK0001') }}
        svg-icon(iconName="plus-square" iconWidth="22px" iconColor="white")
    category-list(v-for="item in categoryListArray"
      v-show="item.show" :ref="item.key" :key="item.key"
      :list="item.content" @loadMore="handleLoadMore")
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
            category-text-item(class="panel-text__item"
              :item="item")
      template(v-slot:category-text-item="{ list, title }")
        div(class="panel-text__items")
          div(v-if="title"
            class="panel-text__header") {{ title }}
          category-text-item(v-for="item in list"
            class="panel-text__item"
            :key="item.id"
            :item="item")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapState, mapGetters, mapMutations } from 'vuex'
import i18n from '@/i18n'
import SearchBar from '@/components/SearchBar.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryTextItem from '@/components/category/CategoryTextItem.vue'
import AssetUtils from '@/utils/assetUtils'
import { ICategoryItem, ICategoryList, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import VueI18n from 'vue-i18n'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'

export default Vue.extend({
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
  props: {
    isInsert: {
      default: false,
      type: Boolean
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
            type: 'category-text-item',
            list: rowItems,
            size: 90,
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
      const list = this.listCategories.concat(this.listResult)
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
          target: i18n.tc('NN0005', 1)
        })}`
    }
  },
  mounted() {
    if (this.isInsert) return
    generalUtils.panelInit('text',
      this.handleSearch,
      this.handleCategorySearch,
      async () => {
        await this.getRecAndCate('textStock')
      })
  },
  activated() {
    const mainContent = (this.$refs.mainContent as Vue[])[0].$el
    const searchResult = (this.$refs.searchResult as Vue[])[0].$el
    mainContent.scrollTop = this.scrollTop.mainContent
    searchResult.scrollTop = this.scrollTop.searchResult
    mainContent.addEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'mainContent'))
    searchResult.addEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'searchResult'))
  },
  deactivated() {
    const mainContent = (this.$refs.mainContent as Vue[])[0].$el
    const searchResult = (this.$refs.searchResult as Vue[])[0].$el
    mainContent.removeEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'mainContent'))
    searchResult.removeEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'searchResult'))
  },
  watch: {
    keyword(newVal: string) {
      if (!newVal) {
        this.$nextTick(() => {
          const mainContent = (this.$refs.mainContent as Vue[])[0].$el
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
      await AssetUtils.addStandardText('body', `${this.$t('NN0494')}`, i18n.locale, undefined, undefined, {
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
      return AssetUtils.getFontMap()[i18n.locale]
    },
    handleScrollTop(event: Event, key: 'mainContent'|'searchResult') {
      this.scrollTop[key] = (event.target as HTMLElement).scrollTop
    },
    processListResult(list = [] as IListServiceContentDataItem[], isSearch: boolean): ICategoryItem[] {
      return new Array(Math.ceil(list.length / 3))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 3, (idx + 1) * 3)
          const title = !isSearch && !idx ? `${this.$t('NN0340')}` : ''
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-text-item',
            list: rowItems,
            title,
            size: title ? (90 + 46) : 90
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
.panel-text {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  padding: 0 24px;
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
    margin: 0 5px;
    // object-fit: contain;
    // vertical-align: middle;
  }
  &__items {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    column-gap: 10px;
  }
  &__header {
    grid-column: 1 / 4;
    line-height: 26px;
    color: #ffffff;
    padding: 10px 0;
    text-align: left;
  }
  &__text-button-wrapper {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 12px;
    margin-bottom: 14px;
    padding: 14px 0;
    box-sizing: border-box;
    background-color: setColor(black-3);
    border-radius: 10px;
    &:active {
      background-color: setColor(black-1-5);
    }
    & > span {
      font-weight: 700;
      font-size: 20px;
      line-height: 28px;
      color: white;
    }
  }
}
</style>
