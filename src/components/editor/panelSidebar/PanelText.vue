<template lang="pug">
  div(class="panel-text")
    search-bar(class="mb-15"
      :placeholder="$t('NN0092', {target: $tc('NN0005',1)})"
      clear
      :defaultKeyword="keyword"
      @search="handleSearch")
    div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
    category-list(ref="list"
      :list="list"
      @loadMore="handleLoadMore")
      template(v-if="pending" #after)
        div(class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
      template(v-slot:default-text="{ list }")
        div(class="panel-text__text-button-wrapper" v-for="config in list"
            :key="config.type"
            draggable="true"
            @dragstart="standardTextDrag($event, config)")
          btn(
            class="panel-text__text-button mb-10"
            :type="`text-${config.type.toLowerCase()}`"
            :fontFamily="localeFont()"
            @click.native="handleAddText(config)") {{ config.text }}
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
import { mapActions, mapState, mapGetters } from 'vuex'
import i18n from '@/i18n'
import SearchBar from '@/components/SearchBar.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryTextItem from '@/components/category/CategoryTextItem.vue'
import AssetUtils, { STANDARD_TEXT_FONT } from '@/utils/assetUtils'
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import DragUtils from '@/utils/dragUtils'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryListRows,
    CategoryTextItem
  },
  data() {
    return {
      scrollTop: 0
    }
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      getLayersNum: 'getLayersNum'
    }),
    ...mapState(
      'textStock',
      [
        'categories',
        'content',
        'pending',
        'host',
        'preview',
        'keyword'
      ]
    ),
    listDefaultText(): any[] {
      const { keyword } = this
      if (keyword) { return [] }
      const key = 'default-text'
      return [{
        type: key,
        id: key,
        size: 174,
        list: [{
          type: 'Heading',
          text: this.$t('NN0011')
        }, {
          type: 'Subheading',
          text: this.$t('NN0012')
        }, {
          type: 'Body',
          text: this.$t('NN0013')
        }]
      }]
    },
    listCategories(): any[] {
      const { keyword, categories } = this
      if (keyword) { return [] }
      return (categories as IListServiceContentData[])
        .map(category => ({
          size: 201,
          id: `rows_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
    },
    listResult(): any[] {
      const { keyword } = this
      const { list = [] } = this.content as { list: IListServiceContentDataItem[] }
      const result = new Array(Math.ceil(list.length / 2))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 2, idx * 2 + 2)
          const title = !keyword && !idx ? `${this.$t('NN0340')}` : ''
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-text-item',
            list: rowItems,
            title,
            size: title ? (155 + 46) : 155
          }
        })
      if (result.length) {
        Object.assign(result[result.length - 1], { sentinel: true })
      }
      return result
    },
    list(): any[] {
      return this.listDefaultText
        .concat(this.listCategories)
        .concat(this.listResult)
    },
    emptyResultMessage(): string {
      return this.keyword && !this.pending && !this.listResult.length ? `${i18n.t('NN0393', { keyword: this.keyword, target: i18n.tc('NN0005', 1) })}` : ''
    }
  },
  async mounted() {
    await this.getCategories()
    this.getContent()
    this.loadDefaultFonts()
  },
  activated() {
    const el = (this.$refs.list as Vue).$el
    el.scrollTop = this.scrollTop
    el.addEventListener('scroll', this.handleScrollTop)
  },
  deactivated() {
    (this.$refs.list as Vue).$el.removeEventListener('scroll', this.handleScrollTop)
  },
  destroyed() {
    this.resetContent()
  },
  methods: {
    ...mapActions('textStock',
      [
        'resetContent',
        'getContent',
        'getTagContent',
        'getCategories',
        'getMoreContent'
      ]
    ),
    async handleSearch(keyword: string) {
      this.resetContent()
      if (keyword) {
        this.getTagContent({ keyword })
      } else {
        await this.getCategories()
        this.getContent()
      }
    },
    handleCategorySearch(keyword: string) {
      this.resetContent()
      this.getContent({ keyword })
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    async handleAddText(config: { type: string, text: string }) {
      await AssetUtils.addStanardText(config.type.toLowerCase(), config.text, i18n.locale)
    },
    localeFont() {
      return AssetUtils.getFontMap()[i18n.locale]
    },
    loadDefaultFonts(objectId = 'OOcHgnEpk9RHYBOiWllz') {
      const getFontUrl = (fontID: string): string => `url("https://template.vivipic.com/font/${fontID}/font")`
      const newFont = new FontFace(objectId, getFontUrl(objectId))
      newFont.load().then((font) => {
        document.fonts.add(font)
      })
    },
    handleScrollTop(event: Event) {
      this.scrollTop = (event.target as HTMLElement).scrollTop
    },
    standardTextDrag(e: DragEvent, config: { type: string, text: string }) {
      const { type: textType, text } = config
      new DragUtils().itemDragStart(e, 'standardText', {
        textType: textType.toLowerCase(),
        text,
        locale: i18n.locale
      }, {
        offsetX: 20,
        offsetY: 30
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
  &__item {
    width: 145px;
    height: 145px;
    margin: 0 auto;
    object-fit: contain;
    vertical-align: middle;
  }
  &__items {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    column-gap: 10px;
  }
  &__header {
    grid-column: 1 / 3;
    line-height: 26px;
    color: #ffffff;
    padding: 10px 0;
    text-align: left;
  }
  &__text-button-wrapper {
    text-align: left;
  }
  &__text-button {
    width: calc(100% - 10px);
    background-color: setColor(gray-2);
    border-radius: 3px;
  }
}
</style>
