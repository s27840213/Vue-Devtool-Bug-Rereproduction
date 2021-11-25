<template lang="pug">
  div(class="panel-text")
    search-bar(class="mb-15"
      placeholder="Search from our text"
      clear
      :defaultKeyword="keyword"
      @search="handleSearch")
    div(v-if="emptyResultMessage" class="text-white") {{ emptyResultMessage }}
    category-list(ref="list"
      :list="list"
      @loadMore="handleLoadMore")
      template(v-if="pending" #after)
        div(class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
      template(v-slot:default-text="{ list }")
        div
          btn(v-for="config in list"
            :key="config.type"
            class="panel-text__text-button mb-10"
            :type="`text-${config.type.toLowerCase()}`"
            :fontFamily="'Mulish'"
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
import AssetUtils from '@/utils/assetUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'

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
          text: this.$t('editor.heading')
        }, {
          type: 'Subheading',
          text: this.$t('editor.subheading')
        }, {
          type: 'Body',
          text: this.$t('editor.body')
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
          const title = !keyword && !idx ? '所有結果' : ''
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
      return this.keyword && !this.pending && !this.listResult.length ? `Sorry, we couldn't find any text for "${this.keyword}".` : ''
    }
  },
  async mounted() {
    (this.$refs.list as Vue).$el.addEventListener('scroll', (event: Event) => {
      this.scrollTop = (event.target as HTMLElement).scrollTop
    })
    await this.getCategories()
    this.getContent()
    this.loadDefaultFonts()
  },
  activated() {
    (this.$refs.list as Vue).$el.scrollTop = this.scrollTop
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
    async handleAddText(config: {type: string, text: string}) {
      await AssetUtils.addStanardText(config.type.toLowerCase(), config.text, i18n.locale)
      ShortcutUtils.textSelectAll(this.getLayersNum() - 1)
    },
    loadDefaultFonts(objectId = 'OOcHgnEpk9RHYBOiWllz') {
      const getFontUrl = (fontID: string): string => `url("https://template.vivipic.com/font/${fontID}/font")`
      const newFont = new FontFace(objectId, getFontUrl(objectId))
      newFont.load().then((font) => {
        document.fonts.add(font)
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
  &__text-button {
    width: 250px;
  }
}
</style>
