<template lang="pug">
  div(class="panel-fonts")
    div(v-if="!noTitle && !isMobile" class="panel-fonts__title")
      span(v-if="!isMobile" class="text-blue-1 label-lg") {{ capitalize($tc('NN0353', 2)) }}
      svg-icon(
        v-if="!isMobile"
        class="panel-fonts__close pointer"
        :iconName="'close'"
        :iconWidth="'30px'"
        :iconColor="'gray-2'"
        @click.native="closeFontsPanel")
    search-bar(placeholder="Search font"
      clear
      :defaultKeyword="keywordLabel"
      vivisticker="white"
      @search="handleSearch")
    div(v-if="emptyResultMessage" class="text-gray-3") {{ emptyResultMessage }}
    font-tag(v-if="!hasSearch" @search="handleSearch")
    category-list(:list="list"
      @loadMore="handleLoadMore")
      template(v-if="pending" #after)
        div(class="text-center")
          svg-icon(iconName="loading"
            iconColor="gray-1"
            iconWidth="20px")
      template(v-slot:title="{ title }")
        div(class="panel-fonts__category-title") {{ title }}
      template(v-slot:category-font-item="{ list }")
        category-font-item(v-for="item in list"
          :host="host"
          :preview="preview"
          :preview2="preview2"
          :item="item"
          :textStyleType="textStyleType")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapState, mapActions, mapMutations } from 'vuex'
import FileUtils from '@/utils/fileUtils'
import TextUtils from '@/utils/textUtils'
import CategoryFontItem from '@/components/category/CategoryFontItem.vue'
import CategoryListFont from '@/components/category/CategoryListFont.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import uploadUtils from '@/utils/uploadUtils'
import i18n from '@/i18n'
import generalUtils from '@/utils/generalUtils'
import FontTag from '@/components/font/FontTag.vue'
import vivistickerUtils from '@/utils/vivistickerUtils'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryFontItem,
    CategoryListFont,
    FontTag
  },
  props: {
    noTitle: {
      type: Boolean,
      default: false
    },
    textStyleType: String
  },
  data() {
    return {
      FileUtils,
      hasSearch: false
    }
  },
  mounted() {
    this.getRecently({ key: 'font' })
  },
  destroyed() {
    this.setShowMore(false)
    TextUtils.setCurrTextInfo({ layerIndex: -1 })
  },
  computed: {
    ...mapState('font', [
      'categories',
      'content',
      'pending',
      'host',
      'preview',
      'preview2',
      'keyword'
    ]),
    ...mapState('text', ['sel', 'props', 'fontPreset']),
    ...mapGetters('font', ['hasNextPage']),
    ...mapGetters('user', {
      isAdmin: 'isAdmin'
    }),
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer',
      assetFonts: 'user/getAssetFonts'
    }),
    keywordLabel(): string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    isMobile(): boolean {
      return generalUtils.isTouchDevice()
    },
    listResult(): any[] {
      const { hasNextPage, keyword } = this
      const { list = [] } = this.content as { list: IListServiceContentDataItem[] }
      if (!keyword) return []
      const result = new Array(list.length)
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
            sentinel: hasNextPage && idx === (list.length - 1)
          }
        })
      if (result.length) {
        result[result.length - 1].sentinel = hasNextPage
      }
      return result
    },
    listCategories(): any[] {
      const { hasNextPage } = this
      const { categories, keyword } = this
      let result = [] as any[]
      if (keyword) return result
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
          ])
        }
      })
      if (result.length) {
        result[result.length - 1].sentinel = hasNextPage
      }
      return result
    },
    list(): any[] {
      return this.listCategories.concat(this.listResult)
    },
    emptyResultMessage(): string {
      return this.keyword && !this.pending && !this.listResult.length ? `${i18n.t('NN0393', { keyword: this.keywordLabel, target: i18n.tc('NN0353', 1) })}` : ''
    }
  },
  methods: {
    ...mapActions('font', [
      'resetContent',
      'getTagContent',
      'getRecently',
      'getMoreContent',
      'getMoreCategory'
    ]),
    ...mapMutations('fontTag', {
      setShowMore: 'SET_SHOW_MORE'
    }),
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    },
    closeFontsPanel() {
      this.resetContent()
      this.$emit('closeFontsPanel')
      this.setShowMore(false)
    },
    handleLoadMore(moreType: string | undefined) {
      const { keyword } = this
      keyword ? this.getMoreContent() : this.getMoreCategory()
    },
    handleSearch(keyword: string) {
      if (keyword) {
        this.hasSearch = true
        this.setShowMore(false)
      } else {
        this.hasSearch = false
      }
      this.resetContent()
      keyword ? this.getTagContent({ keyword }) : this.getRecently({ key: 'font' })
    },
    uploadFont() {
      uploadUtils.chooseAssets('font')
    },
    capitalize(str: string): string {
      return generalUtils.capitalize(str)
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
    text-align: center;
    position: relative;
    margin-bottom: -10px;
    background: white;
    width: 285px;
    min-height: 50px;
    top: -20px;
    left: -20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }
  &__search {
    margin-top: 10px;
  }
  &__close {
    position: absolute;
    right: 5px;
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
      transform: translate3d(0, -100%, 0);
      padding: 12px 0px 8px 0px;
      background-image: linear-gradient(transparent, setColor(white, 0.9) 30%);
      color: setColor(blue-1);
    }
  }
}
.category-list::v-deep::-webkit-scrollbar-thumb {
  border: 3px solid #ffffff;
}
</style>
