<template lang="pug">
  div(class="panel-fonts")
    div(class="panel-fonts__title")
      span(class="text-blue-1 label-lg") Fonts
      svg-icon(class="panel-fonts__close pointer"
        :iconName="'close'"
        :iconWidth="'30px'"
        :iconColor="'gray-2'"
        @click.native="closeFontsPanel")
    search-bar(placeholder="Search font"
      clear
      :defaultKeyword="keyword"
      @search="handleSearch")
    div(v-if="emptyResultMessage" class="text-gray-3") {{ emptyResultMessage }}
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
          :item="item")
    div(class="panel-fonts__upload")
      transition(name="fade-in")
        div(v-if="['uploading', 'success'].includes(fontUploadStatus)"
            class="panel-fonts__upload-status")
          svg-icon(class="mr-5"
            :iconName="uploadStatusIcon"
            :iconWidth="'30px'"
            :iconColor="'green-2'")
          span {{fontUploadStatus === 'uploading' ? '上傳中' : '上傳成功'}}
      btn(class="full-width" :type="'primary-mid'" @click.native="uploadFont()"
        :disabled="fontUploadStatus === 'uploading'") Upload Font
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapState, mapActions } from 'vuex'
import FileUtils from '@/utils/fileUtils'
import TextUtils from '@/utils/textUtils'
import CategoryFontItem from '@/components/category/CategoryFontItem.vue'
import CategoryListFont from '@/components/category/CategoryListFont.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import uploadUtils from '@/utils/uploadUtils'
import tiptapUtils from '@/utils/tiptapUtils'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryFontItem,
    CategoryListFont
  },
  data() {
    return {
      FileUtils,
      fontUploadStatus: 'none'
    }
  },
  mounted() {
    this.getCategories()
    uploadUtils.onFontUploadStatus((status: 'none' | 'uploading' | 'success' | 'fail') => {
      this.fontUploadStatus = status
    })
    if (!tiptapUtils.isRanged) {
      tiptapUtils.focus()
    }
  },
  destroyed() {
    TextUtils.setCurrTextInfo({ layerIndex: -1 })
  },
  computed: {
    ...mapState(
      'font',
      [
        'categories',
        'content',
        'pending',
        'host',
        'preview',
        'preview2',
        'keyword'
      ]
    ),
    ...mapState('text', ['sel', 'props', 'fontPreset']),
    ...mapGetters('font', ['hasNextPage']),
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer',
      assetFonts: 'user/getAssetFonts'
    }),
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
            list: rowItems,
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
              list: [font]
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
    uploadStatusIcon(): string {
      return this.fontUploadStatus === 'uploading' ? 'loading' : 'check'
    },
    emptyResultMessage(): string {
      return this.keyword && !this.pending && !this.listResult.length ? `Sorry, we couldn't find any font for "${this.keyword}".` : ''
    }
  },
  methods: {
    ...mapActions('font',
      [
        'resetContent',
        'getTagContent',
        'getCategories',
        'getMoreContent',
        'getMoreCategory'
      ]
    ),
    getFontUrl(fontID: string): string {
      return `url("https://template.vivipic.com/font/${fontID}/font")`
    },
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    },
    closeFontsPanel() {
      this.resetContent()
      this.$emit('closeFontsPanel')
    },
    // TODO //
    updateFontPreset(e: any) {
      const target = e.target.files[0]
      const fontName: string = target.name.split('.')[0]
      const objectUrl = window.URL.createObjectURL(target)
      const style = document.createElement('style')
      style.innerHTML = `
      @font-face {
        font-family: ${fontName};
        src: url(${objectUrl});
      }
    `
      document.head.appendChild(style)
      TextUtils.updateFontFace({ name: fontName, face: fontName, loaded: true })
    },
    handleLoadMore() {
      const { keyword } = this
      keyword ? this.getMoreContent() : this.getMoreCategory()
    },
    handleSearch(keyword: string) {
      this.resetContent()
      keyword ? this.getTagContent({ keyword }) : this.getCategories()
    },
    uploadFont() {
      uploadUtils.chooseAssets('font')
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-fonts {
  @include size(100%, calc(100vh - 100px));
  display: flex;
  flex-direction: column;
  &__title {
    text-align: center;
    position: relative;
    margin-bottom: 5px;
  }
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
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
