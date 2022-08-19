<template lang="pug">
  div(class="panel-text")
    search-bar(class="panel-text__searchbar"
      :placeholder="$t('NN0092', {target: $tc('NN0005',1)})"
      clear
      :defaultKeyword="keywordLabel"
      vivisticker
      :color="{close: 'white', search: 'white'}"
      @search="handleSearch")
    div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
    template(v-if="!keyword")
      div(class="panel-text__text-button-title py-10 text-white") {{ $t('NN0089') }}
      div(class="panel-text__text-button-wrapper"
          :style="`font-family: ${localeFont()}`"
          @click="handleAddText")
        span {{ $t('STK0001') }}
    category-list(ref="list"
      :list="list"
      @loadMore="handleLoadMore")
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
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import DragUtils from '@/utils/dragUtils'
import textUtils from '@/utils/textUtils'
import VueI18n from 'vue-i18n'
import tiptapUtils from '@/utils/tiptapUtils'
import generalUtils from '@/utils/generalUtils'

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
    ...mapState('textStock', [
      'categories',
      'content',
      'pending',
      'host',
      'preview',
      'keyword'
    ]),
    keywordLabel():string {
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
      return this.listCategories
        .concat(this.listResult)
    },
    emptyResultMessage(): string {
      return this.keyword && !this.pending && !this.listResult.length ? `${i18n.t('NN0393', { keyword: this.keywordLabel, target: i18n.tc('NN0005', 1) })}` : ''
    }
  },
  async mounted() {
    generalUtils.panelInit('text',
      this.handleSearch,
      this.handleCategorySearch,
      async () => {
        this.getRecently()
        this.getContent()
        textUtils.loadDefaultFonts()
      })
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
    ...mapActions('textStock', [
      'resetContent',
      'getContent',
      'getTagContent',
      'getRecently',
      'getMoreContent'
    ]),
    ...mapMutations({
      setSettingsOpen: 'brandkit/SET_isSettingsOpen'
    }),
    async handleSearch(keyword: string) {
      this.resetContent()
      if (keyword) {
        this.getTagContent({ keyword })
      } else {
        this.getRecently()
        this.getContent()
      }
    },
    handleCategorySearch(keyword: string, locale = '') {
      this.resetContent()
      if (keyword) {
        this.getContent({ keyword, locale })
      } else {
        this.getRecently()
        this.getContent()
      }
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    async handleAddText() {
      // await AssetUtils.addStandardText(config.type.toLowerCase(), config.text, i18n.locale, undefined, undefined)
      console.log('start editing standard text')
    },
    localeFont() {
      return AssetUtils.getFontMap()[i18n.locale]
    },
    handleScrollTop(event: Event) {
      this.scrollTop = (event.target as HTMLElement).scrollTop
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
  &__searchbar {
    margin-top: 24px;
    margin-bottom: 14px;
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
  &__text-button-title {
    line-height: 26px;
    text-align: left;
    margin-bottom: 12px;
  }
  &__text-button-wrapper {
    text-align: left;
    width: 100%;
    margin-bottom: 14px;
    padding: 14px 0 14px 16px;
    box-sizing: border-box;
    background-color: setColor(gray-3);
    border-radius: 10px;
    & > span {
      font-weight: 700;
      font-size: 20px;
      line-height: 28px;
      color: white;
    }
  }
}
</style>
