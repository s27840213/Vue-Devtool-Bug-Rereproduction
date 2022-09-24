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
      scrollTop: 0
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
      isTabShowAllRecently: 'vivisticker/getShowAllRecently'
    }),
    ...mapState('textStock', [
      'categories',
      'content',
      'pending',
      'host',
      'preview',
      'keyword'
    ]),
    isInCategory(): boolean {
      return this.isTabInCategory('text')
    },
    showAllRecently(): boolean {
      return this.isTabShowAllRecently('text')
    },
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
        .filter(category => category.list.length > 0)
        .map(category => ({
          size: 140,
          id: `rows_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
    },
    listRecently(): any[] {
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
    listResult(): any[] {
      const { keyword } = this
      const { list = [] } = this.content as { list: IListServiceContentDataItem[] }
      const result = new Array(Math.ceil(list.length / 3))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 3, idx * 3 + 3)
          const title = !keyword && !idx ? `${this.$t('NN0340')}` : ''
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-text-item',
            list: rowItems,
            title,
            size: title ? (90 + 46) : 90
          }
        })
      if (result.length) {
        Object.assign(result[result.length - 1], { sentinel: true })
      }
      return result
    },
    list(): any[] {
      if (this.showAllRecently) {
        return this.listRecently
      }
      return this.listCategories
        .concat(this.listResult)
    },
    emptyResultMessage(): string {
      return this.keyword && !this.pending && !this.listResult.length && !this.showAllRecently ? `${i18n.t('NN0393', { keyword: this.keywordLabel, target: i18n.tc('NN0005', 1) })}` : ''
    }
  },
  mounted() {
    if (this.isInsert) return
    generalUtils.panelInit('text',
      this.handleSearch,
      this.handleCategorySearch,
      async () => {
        await this.getRecAndCate('textStock')
        await this.getContent()
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
  methods: {
    ...mapActions('textStock', [
      'resetContent',
      'getContent',
      'getTagContent',
      'getRecently',
      'getRecAndCate',
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
        this.getRecAndCate('textStock').then(() => { this.getContent() })
      }
    },
    handleCategorySearch(keyword: string, locale = '') {
      this.resetContent()
      if (keyword) {
        if (keyword === `${this.$t('NN0024')}`) {
          this.getRecently({ key: 'textStock', keyword })
          vivistickerUtils.setShowAllRecently('text', true)
        } else {
          this.getContent({ keyword, locale })
        }
        vivistickerUtils.setIsInCategory('text', true)
      } else {
        vivistickerUtils.setShowAllRecently('text', false)
        this.getRecAndCate('textStock').then(() => { this.getContent() })
      }
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    async addStandardText() {
      await AssetUtils.addStandardText('body', `${this.$t('NN0494')}`, i18n.locale, undefined, undefined, {
        size: 21,
        color: '#FFFFFF',
        weight: 'bold'
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
    margin: 0 auto;
    object-fit: contain;
    vertical-align: middle;
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
