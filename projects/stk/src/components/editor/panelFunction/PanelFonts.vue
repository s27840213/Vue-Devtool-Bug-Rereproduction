<template lang="pug">
div(class="panel-fonts")
  div(v-if="!noTitle && !$isTouchDevice()" class="panel-fonts__title")
    span(v-if="!$isTouchDevice()" class="text-blue-1 label-lg") {{ capitalize($tc('NN0353', 2)) }}
    svg-icon(
      v-if="!$isTouchDevice()"
      class="panel-fonts__close pointer"
      :iconName="'close'"
      :iconWidth="'30px'"
      :iconColor="'gray-2'"
      @click="closeFontsPanel")
  search-bar(placeholder="Search font"
    clear
    :defaultKeyword="keywordLabel"
    vivisticker="white"
    @search="handleSearch")
  div(v-if="emptyResultMessage" class="text-gray-3") {{ emptyResultMessage }}
  font-tag(v-if="!keyword" :tags="tags"
          @search="handleSearch" @showMore="setShowMore")
  //- Search result and main content
  category-list(v-for="item in categoryListArray"
                v-show="item.show" :ref="item.key" :key="item.key"
                :list="item.content" @loadMore="handleLoadMore")
    template(v-if="pending" #after)
      div(class="text-center")
        svg-icon(iconName="loading"
          iconColor="gray-1"
          iconWidth="20px")
    template(v-slot:title="{ title }")
      div(class="panel-fonts__category-title") {{ title }}
    template(v-slot:category-font-item="{ list }")
      category-font-item(v-for="item in list"
        :key="item.id"
        :item="item"
        :textStyleType="textStyleType || ''")
  div(v-if="showMore" class="cover-background")
</template>

<script lang="ts">
import CategoryFontItem from '@/components/category/CategoryFontItem.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import FontTag from '@/components/global/Tags.vue'
import SearchBar from '@/components/SearchBar.vue'
import { ICategoryItem, ICategoryList, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import generalUtils from '@/utils/generalUtils'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  components: {
    SearchBar,
    CategoryList,
    CategoryFontItem,
    FontTag
  },
  props: {
    noTitle: {
      type: Boolean,
      default: false
    },
    textStyleType: {
      type: String,
    }
  },
  emits: ['closeFontsPanel'],
  data() {
    return {
    }
  },
  mounted() {
    this.getRecently({ key: 'font' })
    if (this.tags.length === 0) {
      this.addFontTags()
    }
  },
  unmounted() {
    this.setShowMore(false)
  },
  computed: {
    ...mapState('font', {
      categories: 'categories',
      rawContent: 'content',
      rawSearchResult: 'searchResult',
      keyword: 'keyword'
    }),
    ...mapState('fontTag', {
      _tags: 'tags',
      showMore: 'showMore',
    }),
    ...mapState('text', ['sel', 'props', 'fontPreset']),
    ...mapGetters('font', ['hasNextPage', 'pending']),
    ...mapGetters('user', {
      isAdmin: 'isAdmin'
    }),
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      assetFonts: 'user/getAssetFonts'
    }),
    tags() {
      return this._tags.map((tag: string) => ({
        label: tag, value: tag, active: false,
      }))
    },
    keywordLabel(): string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    listCategories(): ICategoryItem[] {
      const { hasNextPage } = this
      const { categories } = this
      let result = [] as ICategoryItem[]
      categories.forEach((category: IListServiceContentData) => {
        if (category.list.length) {
          result = result.concat([
            {
              size: 36,
              id: category.title,
              type: 'title',
              title: category.title
            },
            ...category.list.map((font, idx) => ({
              id: `${category.title}_${idx}`,
              size: 32,
              type: 'category-font-item',
              list: [{
                ...font,
                fontType: 'public',
                userId: font.user_id,
                assetId: font.src === 'admin' ? font.asset_id : font.asset_index?.toString()
              }]
            }))
          ] as ICategoryItem[])
        }
      })
      if (result.length) {
        result[result.length - 1].sentinel = hasNextPage
      }
      return result
    },
    listResult(): ICategoryItem[] {
      return this.processListResult(this.rawContent.list, false)
    },
    searchResult(): ICategoryItem[] {
      const list = this.processListResult(this.rawSearchResult.list, true)
      if (list.length !== 0) {
        Object.assign(list[list.length - 1], { sentinel: this.hasNextPage })
      }
      return list
    },
    mainContent(): ICategoryItem[] {
      const list = this.listCategories.concat(this.listResult)
      if (list.length !== 0) {
        Object.assign(list[list.length - 1], { sentinel: this.hasNextPage })
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
        target: this.$tc('NN0353', 1)
      })}`
    }
  },
  methods: {
    ...mapActions('fontTag', {
      addFontTags: 'ADD_FONT_TAGS'
    }),
    ...mapMutations('fontTag', {
      setShowMore: 'SET_SHOW_MORE'
    }),
    ...mapActions('font', [
      'resetContent',
      'getTagContent',
      'getRecently',
      'getMoreContent',
      'getMoreCategory',
      'resetSearch'
    ]),
    closeFontsPanel() {
      // don't reset content for panelTextSetting preview to use ver looked-up from content
      // this.resetContent()
      this.$emit('closeFontsPanel')
      this.setShowMore(false)
    },
    handleLoadMore(moreType: string | undefined) {
      const { keyword } = this
      keyword ? this.getMoreContent() : this.getMoreCategory()
    },
    handleSearch(keyword: string) {
      this.resetSearch()
      if (keyword) {
        this.setShowMore(false)
        this.getTagContent({ keyword })
      }
    },
    capitalize(str: string): string {
      return generalUtils.capitalize(str)
    },
    processListResult(list = [] as IListServiceContentDataItem[], isSearch: boolean): ICategoryItem[] {
      return new Array(list.length)
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx, idx + 1)
          return {
            id: `${rowItems.map(item => item.id).join('_')}`,
            size: 32,
            type: 'category-font-item',
            list: rowItems.map(item => ({
              ...item,
              fontType: 'public',
              userId: item.user_id,
              assetId: item.src === 'admin' ? item.asset_id : item.asset_index?.toString()
            })),
            sentinel: false
          }
        })
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-fonts {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  overflow-x: hidden;
  &__title {
    position: relative;
    text-align: center;
    margin-bottom: 30px;
    background: white;
    height: 30px;
  }
  > * + div{
    margin-top: 15px;
  }
  &__search {
    margin-top: 10px;
  }
  .search-bar {
    flex-shrink: 0;
  }
  &__close {
    position: absolute;
    right: 0px;
  }
  &__items {
    display: grid;
    grid-auto-rows: auto;
    grid-template-columns: auto;
    grid-gap: 10px;
    margin-left: auto;
  }
  &__category-title {
    color: setColor(gray-3);
    text-align: left;
    font-size: 14px;
    line-height: 36px;
  }

  &__upload {
    position: relative;
    &-status {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      position: absolute;
      transform: translate(0, -100%);
      padding: 12px 0px 8px 0px;
      background-image: linear-gradient(transparent, setColor(white, 0.9) 30%);
      color: setColor(blue-1);
    }
  }
}
.category-list::-webkit-scrollbar-thumb {
  border: 3px solid #ffffff;
}
.cover-background {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
