<template lang="pug">
div(class="panel-text")
  search-bar(class="mb-15"
    :placeholder="$t('NN0092', {target: $tc('NN0005',1)})"
    clear
    :defaultKeyword="keywordLabel"
    @search="handleSearch")
  div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
  template(v-if="!keyword")
    template(v-if="isBrandkitAvailable")
      div(class="panel-text__brand-header relative")
        brand-selector(theme="panel" :defaultOption="true")
        div(class="panel-text__brand-settings pointer"
        @click="handleOpenSettings")
          svg-icon(iconName="settings" iconColor="white" iconWidth="24px")
    template(v-if="!isBrandkitAvailable || isDefaultSelected")
      div(class="panel-text__text-button-wrapper" v-for="config in listDefaultText"
          :key="config.type"
          draggable="true"
          @dragstart="standardTextDrag($event, config)")
        btn(
          class="panel-text__text-button mb-10"
          :type="`text-${config.type.toLowerCase()}`"
          :fontFamily="localeFont()"
          @click.native="handleAddText(config)") {{ config.text }}
    template(v-else)
      div(class="panel-text__text-button-wrapper" v-for="config in listDefaultText"
          :key="config.type"
          draggable="true"
          @dragstart="standardTextDrag($event, config)")
        btn(
          class="panel-text__text-button mb-10"
          :style="getFontStyles(config.type.toLowerCase())"
          :type="`text-${config.type.toLowerCase()}`"
          @click.native="handleAddText(config)") {{ config.text }}
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
      div(class="panel-text__items"
        :style="{gridTemplateColumns: `repeat(${amountInRow}, 1fr)`}")
        div(v-if="title"
          :style="{gridColumn: `1 / ${amountInRow+1}`}"
          class="panel-text__header") {{ title }}
        category-text-item(v-for="item in list"
          class="panel-text__item"
          :key="item.id"
          :item="item")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapState, mapGetters, mapMutations } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryTextItem from '@/components/category/CategoryTextItem.vue'
import BrandSelector from '@/components/brandkit/BrandSelector.vue'
import AssetUtils from '@/utils/assetUtils'
import { ICategoryItem, ICategoryList, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import DragUtils from '@/utils/dragUtils'
import textUtils from '@/utils/textUtils'
import { IBrand, IBrandTextStyle, IBrandTextStyleSetting } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'
import VueI18n from 'vue-i18n'
import tiptapUtils from '@/utils/tiptapUtils'
import generalUtils from '@/utils/generalUtils'

export default defineComponent({
  components: {
    SearchBar,
    CategoryList,
    CategoryListRows,
    CategoryTextItem,
    BrandSelector
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
      isDefaultSelected: 'brandkit/getIsDefaultSelected',
      currentBrand: 'brandkit/getCurrentBrand'
    }),
    ...mapState('textStock', {
      categories: 'categories',
      rawContent: 'content',
      rawSearchResult: 'searchResult',
      pending: 'pending',
      keyword: 'keyword'
    }),
    keywordLabel():string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    isBrandkitAvailable(): boolean {
      return brandkitUtils.isBrandkitAvailable
    },
    textStyleSetting(): IBrandTextStyleSetting {
      return (this.currentBrand as IBrand).textStyleSetting
    },
    extractFonts(): ReturnType<typeof brandkitUtils.extractFonts> {
      return this.isBrandkitAvailable ? brandkitUtils.extractFonts(this.textStyleSetting) : []
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
        .map((category, index) => ({
          size: 140,
          id: `rows_${index}_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
    },
    amountInRow():number {
      return generalUtils.isTouchDevice() ? 3 : 2
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
      if (pending || !keyword || this.searchResult.length > 0) return ''
      return `${this.$t('NN0393', {
          keyword: this.keywordLabel,
          target: this.$tc('NN0005', 1)
        })}`
    }
  },
  async mounted() {
    generalUtils.panelInit('text',
      this.handleSearch,
      this.handleCategorySearch,
      async () => {
        this.getRecAndCate()
        this.getContent()
        textUtils.loadDefaultFonts(this.extractFonts)
      })
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
    currentBrand() {
      textUtils.loadDefaultFonts(this.extractFonts)
    },
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
    ...mapActions('textStock', [
      'getContent',
      'getTagContent',
      'getRecAndCate',
      'getMoreContent',
      'resetSearch'
    ]),
    ...mapMutations({
      setSettingsOpen: 'brandkit/SET_isSettingsOpen'
    }),
    getTextStyle(type: string): IBrandTextStyle {
      return (this.textStyleSetting)[`${type}Style` as 'headingStyle'|'subheadingStyle'|'bodyStyle']
    },
    getFontStyles(type: string): { [key: string]: string } {
      const textStyle = this.getTextStyle(type)
      const res = tiptapUtils.textStylesRaw({
        weight: textStyle.bold ? 'bold' : 'normal',
        style: textStyle.italic ? 'italic' : 'normal',
        decoration: textStyle.underline ? 'underline' : 'none',
        size: textStyle.size
      })
      delete res['font-size']
      res.fontFamily = textStyle.isDefault ? brandkitUtils.getDefaultFontId(this.$i18n.locale) : textStyle.fontId
      return res
    },
    handleSearch(keyword: string) {
      this.resetSearch()
      if (keyword) {
        this.getTagContent({ keyword })
      }
    },
    handleCategorySearch(keyword: string, locale = '') {
      this.resetSearch()
      if (keyword) {
        this.getContent({ keyword, locale })
      }
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    async handleAddText(config: { type: string, text: string }) {
      await AssetUtils.addStandardText(config.type.toLowerCase(), config.text, this.$i18n.locale, undefined, undefined, this.getSpanStyles(config.type.toLowerCase()))
    },
    handleOpenSettings() {
      this.setSettingsOpen(true)
    },
    localeFont() {
      return AssetUtils.getFontMap()[this.$i18n.locale]
    },
    handleScrollTop(event: Event, key: 'mainContent'|'searchResult') {
      this.scrollTop[key] = (event.target as HTMLElement).scrollTop
    },
    standardTextDrag(e: DragEvent, config: { type: string, text: string }) {
      const { type: textType, text } = config
      new DragUtils().itemDragStart(e, 'standardText', {
        textType: textType.toLowerCase(),
        text,
        locale: this.$i18n.locale,
        spanStyles: this.getSpanStyles(textType.toLowerCase())
      }, {
        offsetX: 20,
        offsetY: 30
      })
    },
    getSpanStyles(type: string): {[key: string]: string | number} {
      let styles = {} as {[key: string]: string | number}
      if (this.isBrandkitAvailable && !this.isDefaultSelected) {
        const textStyle = this.getTextStyle(type)
        styles = {
          weight: textStyle.bold ? 'bold' : 'normal',
          style: textStyle.italic ? 'italic' : 'normal',
          decoration: textStyle.underline ? 'underline' : 'none',
          size: textStyle.size
        }
        if (!textStyle.isDefault) {
          Object.assign(styles, {
            font: textStyle.fontId,
            type: textStyle.fontType ?? 'public',
            userId: textStyle.fontUserId ?? '',
            assetId: textStyle.fontAssetId ?? ''
          })
        }
      }
      return styles
    },
    processListResult(list = [] as IListServiceContentDataItem[], isSearch: boolean): ICategoryItem[] {
      const { amountInRow } = this
      return new Array(Math.ceil(list.length / amountInRow))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * amountInRow, (idx + 1) * amountInRow)
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
    object-fit: contain;
    vertical-align: middle;
  }
  &__items {
    display: grid;
    // grid-template-columns: repeat(2, 1fr); // Move to inline style
    column-gap: 10px;
  }
  &__header {
    // grid-column: 1 / 4; // Move to inline style
    line-height: 26px;
    color: #ffffff;
    padding: 10px 0;
    text-align: left;
  }
  &__text-button-wrapper {
    text-align: left;
  }
  &__text-button {
    width: 100%;
    background-color: setColor(gray-2);
    border-radius: 3px;
    --base-stroke: 0px;
  }
}
</style>
